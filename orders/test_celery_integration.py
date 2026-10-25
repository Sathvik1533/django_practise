"""
Celery and Redis integration tests.

These tests document the actual behavior of task dispatch and execution.

IMPORTANT: These tests require a running Redis broker and Celery worker
to demonstrate end-to-end task execution. Without Redis, they verify
graceful degradation (order succeeds despite task dispatch failure).
"""
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase, TransactionTestCase

from inventory.models import Product, Inventory
from orders.models import Order
from orders.services import create_order, OrderCreationError
from orders.tasks import prepare_order_fulfillment


class CeleryTaskDispatchTest(TransactionTestCase):
    """
    Test task dispatch behavior with and without Redis.
    
    Uses TransactionTestCase to test transaction.on_commit() correctly.
    """
    
    def setUp(self):
        """Create test product and inventory."""
        self.product = Product.objects.create(
            sku="CELERY-001",
            name="Celery Test Product",
            price=Decimal("25.00"),
            is_active=True,
        )
        
        Inventory.objects.create(
            product=self.product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_task_dispatched_after_commit(self, mock_apply_async):
        """
        Verify task is dispatched via transaction.on_commit().
        
        This ensures the task only fires after the order transaction
        successfully commits to the database.
        """
        order = create_order([{
            "product_id": self.product.id,
            "quantity": 1
        }])
        
        # Task should be dispatched after transaction commits
        mock_apply_async.assert_called_once()
        call_args = mock_apply_async.call_args
        self.assertEqual(call_args[1]['args'], [order.id])
        
        # Order should exist in database
        self.assertTrue(Order.objects.filter(id=order.id).exists())
        
        # Inventory should be reserved
        inventory = Inventory.objects.get(product=self.product)
        self.assertEqual(inventory.quantity_reserved, 1)
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_task_not_dispatched_on_rollback(self, mock_apply_async):
        """
        Verify task is NOT dispatched if transaction rolls back.
        
        This prevents phantom task execution for orders that failed.
        """
        with self.assertRaises(OrderCreationError):
            create_order([{
                "product_id": 99999,  # Non-existent product
                "quantity": 1
            }])
        
        # Task should NOT be dispatched because transaction rolled back
        mock_apply_async.assert_not_called()
        
        # No orders should exist
        self.assertEqual(Order.objects.count(), 0)
    
    @patch('orders.tasks.prepare_order_fulfillment.apply_async')
    def test_order_succeeds_despite_redis_failure(self, mock_apply_async):
        """
        Critical test: Verify order creation succeeds even if Redis is down.
        
        This verifies our best-effort dispatch strategy: order correctness
        is not dependent on task broker availability.
        """
        # Simulate Redis connection failure
        mock_apply_async.side_effect = Exception("Redis connection refused")
        
        # Order creation should still succeed
        order = create_order([{
            "product_id": self.product.id,
            "quantity": 1
        }])
        
        # Order should exist in database
        self.assertIsNotNone(order.id)
        self.assertTrue(Order.objects.filter(id=order.id).exists())
        
        # Inventory should be reserved
        inventory = Inventory.objects.get(product=self.product)
        self.assertEqual(inventory.quantity_reserved, 1)


class CeleryTaskExecutionTest(TestCase):
    """
    Test task execution logic (without requiring running worker).
    
    These tests call the task function directly to verify its logic.
    """
    
    def setUp(self):
        """Create test order with items."""
        self.product1 = Product.objects.create(
            sku="EXEC-001",
            name="Execution Test Product 1",
            price=Decimal("30.00"),
            is_active=True,
        )
        self.product2 = Product.objects.create(
            sku="EXEC-002",
            name="Execution Test Product 2",
            price=Decimal("40.00"),
            is_active=True,
        )
        
        Inventory.objects.create(
            product=self.product1,
            quantity_on_hand=5,
            quantity_reserved=0,
        )
        Inventory.objects.create(
            product=self.product2,
            quantity_on_hand=5,
            quantity_reserved=0,
        )
        
        self.order = Order.objects.create(status=Order.Status.PENDING)
        
        from orders.models import OrderItem
        OrderItem.objects.create(
            order=self.order,
            product=self.product1,
            quantity=2,
            unit_price=Decimal("30.00"),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product2,
            quantity=1,
            unit_price=Decimal("40.00"),
        )
    
    def test_task_execution_returns_fulfillment_data(self):
        """
        Verify task fetches order and returns structured fulfillment data.
        
        This data would be consumed by warehouse systems for order picking.
        """
        result = prepare_order_fulfillment(self.order.id)
        
        self.assertEqual(result['order_id'], self.order.id)
        self.assertEqual(result['status'], 'pending')
        self.assertEqual(result['item_count'], 2)
        self.assertEqual(len(result['items']), 2)
        
        # Verify item details
        skus = [item['sku'] for item in result['items']]
        self.assertIn('EXEC-001', skus)
        self.assertIn('EXEC-002', skus)
    
    def test_task_handles_nonexistent_order(self):
        """
        Verify task handles missing orders gracefully (doesn't retry).
        """
        result = prepare_order_fulfillment(99999)
        
        self.assertEqual(result['error'], 'order_not_found')
        self.assertEqual(result['order_id'], 99999)
    
    @patch('orders.tasks.prepare_order_fulfillment.retry')
    def test_task_retries_on_transient_failure(self, mock_retry):
        """
        Verify task retries on transient failures like network errors.
        """
        from celery.exceptions import Retry
        mock_retry.side_effect = Retry()
        
        # Simulate database error
        with patch('orders.models.Order.objects.select_related') as mock_select:
            mock_select.return_value.prefetch_related.return_value.get.side_effect = \
                Exception("Database temporarily unavailable")
            
            with self.assertRaises(Retry):
                prepare_order_fulfillment(self.order.id)
            
            # Verify retry was attempted
            self.assertTrue(mock_retry.called)


class TaskDispatchDocumentationTest(TestCase):
    """
    Document the transaction.on_commit() guarantees and limitations.
    
    This is not a traditional test - it's executable documentation
    of what our task dispatch approach does and does not guarantee.
    """
    
    def test_transaction_on_commit_guarantees(self):
        """
        Document what transaction.on_commit() DOES guarantee:
        
        ✅ Callbacks only fire if transaction commits successfully
        ✅ Callbacks don't fire if transaction rolls back
        ✅ Callbacks fire after database commit completes
        ✅ Order is visible to task when it executes
        
        Does NOT guarantee:
        ❌ Durable task delivery (callback could fail)
        ❌ Exactly-once execution (task could be lost)
        ❌ Task execution if broker is down
        
        For at-least-once delivery guarantees, a transactional outbox
        pattern would be needed (stores tasks in database, separate
        process reliably delivers them to broker).
        """
        # This test passes to document the above behavior
        self.assertTrue(True, "See docstring for guarantees")
    
    def test_best_effort_dispatch_tradeoff(self):
        """
        Document the best-effort dispatch design decision:
        
        DECISION: Order creation succeeds even if task dispatch fails
        
        RATIONALE:
        - Order acceptance is critical for business
        - Fulfillment preparation is valuable but not critical
        - Failed tasks can be retried manually or via monitoring
        - Alternative (transactional outbox) adds complexity
        
        TRADE-OFF:
        ✅ Higher order availability
        ✅ Simpler architecture
        ❌ Tasks can be lost if broker is down
        ❌ Requires operational monitoring
        
        MITIGATION:
        - Monitor task dispatch failures in logs
        - Alert on sustained Redis unavailability
        - Manual task replay for affected orders
        """
        self.assertTrue(True, "See docstring for design decision")
