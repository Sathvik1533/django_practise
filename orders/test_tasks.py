"""
Tests for Celery background tasks.

Tests verify:
- Task registration and discovery
- Task execution logic
- Dispatch timing (only after transaction commits)
- Error handling and retry behavior
"""
from decimal import Decimal
from unittest.mock import patch, MagicMock, call
from django.test import TestCase, TransactionTestCase
from celery.exceptions import Retry

from inventory.models import Product, Inventory
from orders.models import Order, OrderItem
from orders.tasks import prepare_order_fulfillment, dispatch_order_fulfillment
from orders.services import create_order


class TaskRegistrationTest(TestCase):
    """Test that Celery tasks are properly registered."""
    
    def test_prepare_order_fulfillment_is_registered(self):
        """Verify task is registered with correct name."""
        from config.celery import app
        
        registered_tasks = list(app.tasks.keys())
        self.assertIn('orders.tasks.prepare_order_fulfillment', registered_tasks)
    
    def test_prepare_order_fulfillment_has_retry_config(self):
        """Verify task has retry configuration."""
        task = prepare_order_fulfillment
        
        self.assertEqual(task.max_retries, 3)
        self.assertEqual(task.default_retry_delay, 60)


class PrepareOrderFulfillmentTest(TestCase):
    """Test the prepare_order_fulfillment task execution."""
    
    def setUp(self):
        """Create test order with items."""
        self.product1 = Product.objects.create(
            sku="TEST-001",
            name="Test Product 1",
            price=Decimal("10.00"),
            is_active=True,
        )
        self.product2 = Product.objects.create(
            sku="TEST-002",
            name="Test Product 2",
            price=Decimal("20.00"),
            is_active=True,
        )
        
        Inventory.objects.create(
            product=self.product1,
            quantity_on_hand=100,
            quantity_reserved=0,
        )
        Inventory.objects.create(
            product=self.product2,
            quantity_on_hand=50,
            quantity_reserved=0,
        )
        
        self.order = Order.objects.create(status=Order.Status.PENDING)
        
        OrderItem.objects.create(
            order=self.order,
            product=self.product1,
            quantity=2,
            unit_price=Decimal("10.00"),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product2,
            quantity=1,
            unit_price=Decimal("20.00"),
        )
    
    def test_prepare_order_fulfillment_success(self):
        """Test successful fulfillment preparation."""
        result = prepare_order_fulfillment(self.order.id)
        
        self.assertEqual(result['order_id'], self.order.id)
        self.assertEqual(result['status'], 'pending')
        self.assertEqual(result['item_count'], 2)
        self.assertEqual(len(result['items']), 2)
        
        # Verify item details
        skus = [item['sku'] for item in result['items']]
        self.assertIn('TEST-001', skus)
        self.assertIn('TEST-002', skus)
    
    def test_prepare_order_fulfillment_order_not_found(self):
        """Test handling of non-existent order."""
        result = prepare_order_fulfillment(99999)
        
        self.assertEqual(result['error'], 'order_not_found')
        self.assertEqual(result['order_id'], 99999)
    
    @patch('orders.tasks.prepare_order_fulfillment.retry')
    def test_prepare_order_fulfillment_retries_on_exception(self, mock_retry):
        """Test task retries on transient failures."""
        mock_retry.side_effect = Retry()
        
        # Simulate database error
        with patch('orders.models.Order.objects.select_related') as mock_select:
            mock_select.return_value.prefetch_related.return_value.get.side_effect = \
                Exception("Database connection lost")
            
            with self.assertRaises(Retry):
                prepare_order_fulfillment(self.order.id)
            
            # Verify retry was called
            self.assertTrue(mock_retry.called)


class DispatchOrderFulfillmentTest(TestCase):
    """Test the dispatch_order_fulfillment helper function."""
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_dispatch_calls_apply_async(self, mock_apply_async):
        """Test dispatch sends task to Celery."""
        order_id = 123
        
        dispatch_order_fulfillment(order_id)
        
        mock_apply_async.assert_called_once_with(args=[123])
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    @patch('orders.tasks.logger')
    def test_dispatch_logs_failure_without_crashing(self, mock_logger, mock_apply_async):
        """Test dispatch handles Redis unavailability gracefully."""
        mock_apply_async.side_effect = Exception("Redis connection refused")
        
        # Should not raise - just log the error
        dispatch_order_fulfillment(123)
        
        # Verify error was logged
        self.assertTrue(mock_logger.error.called)


class TransactionCommitDispatchTest(TransactionTestCase):
    """
    Test that tasks are only dispatched after transaction commits.
    
    Uses TransactionTestCase because we need to test transaction.on_commit()
    behavior, which doesn't work properly with TestCase's transaction wrapping.
    """
    
    def setUp(self):
        """Create test products and inventory."""
        self.product = Product.objects.create(
            sku="TXN-001",
            name="Transaction Test Product",
            price=Decimal("15.00"),
            is_active=True,
        )
        
        Inventory.objects.create(
            product=self.product,
            quantity_on_hand=100,
            quantity_reserved=0,
        )
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_task_dispatched_after_successful_commit(self, mock_apply_async):
        """
        Test that fulfillment task is dispatched only after order commits.
        
        This is critical: if the transaction rolls back, the task should
        never be dispatched (preventing phantom fulfillment attempts).
        """
        items = [{"product_id": self.product.id, "quantity": 2}]
        
        order = create_order(items)
        
        # Task should be dispatched after transaction commits
        mock_apply_async.assert_called_once()
        call_args = mock_apply_async.call_args
        self.assertEqual(call_args[1]['args'], [order.id])
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_task_not_dispatched_on_rollback(self, mock_apply_async):
        """
        Test that fulfillment task is NOT dispatched if transaction rolls back.
        
        This verifies transaction.on_commit() correctly prevents dispatch
        when the order creation fails and rolls back.
        """
        from orders.services import OrderCreationError
        
        items = [{"product_id": 99999, "quantity": 1}]  # Non-existent product
        
        with self.assertRaises(OrderCreationError):
            create_order(items)
        
        # Task should NOT be dispatched because transaction rolled back
        mock_apply_async.assert_not_called()
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_task_dispatch_failure_does_not_crash_order_creation(self, mock_apply_async):
        """
        Test that Redis unavailability doesn't prevent order creation.
        
        This is a critical correctness property: even if the task broker
        is down, the synchronous order transaction must succeed. The task
        dispatch is best-effort, not required for order correctness.
        """
        mock_apply_async.side_effect = Exception("Redis connection refused")
        
        items = [{"product_id": self.product.id, "quantity": 1}]
        
        # Order creation should succeed despite task dispatch failure
        order = create_order(items)
        
        self.assertIsNotNone(order.id)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.items.count(), 1)
        
        # Verify inventory was reserved despite task failure
        inventory = Inventory.objects.get(product=self.product)
        self.assertEqual(inventory.quantity_reserved, 1)
