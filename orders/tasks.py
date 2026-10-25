"""
Background tasks for order processing.

This module contains Celery tasks for asynchronous post-order workflows.
Tasks are dispatched via transaction.on_commit() to ensure they only run
after the order transaction successfully commits.
"""
import logging
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='orders.tasks.prepare_order_fulfillment',
    max_retries=3,
    default_retry_delay=60,
)
def prepare_order_fulfillment(self, order_id):
    """
    Prepare order for fulfillment after successful creation.
    
    This task runs asynchronously after an order transaction commits.
    It performs non-transactional fulfillment preparation work:
    - Logs order details for warehouse systems
    - Could trigger warehouse picking workflows
    - Could update external fulfillment systems
    
    Args:
        order_id: Primary key of the Order to prepare
        
    Returns:
        dict: Summary of fulfillment preparation
        
    Raises:
        Retry: On transient failures (network, external API)
    """
    from orders.models import Order, OrderItem
    
    try:
        # Fetch order with items (outside the critical transaction path)
        order = Order.objects.select_related().prefetch_related(
            'items__product'
        ).get(pk=order_id)
        
        # Simulate fulfillment preparation work
        items_summary = []
        for item in order.items.all():
            items_summary.append({
                'sku': item.product.sku,
                'name': item.product.name,
                'quantity': item.quantity,
                'unit_price': str(item.unit_price),
            })
        
        fulfillment_data = {
            'order_id': order.id,
            'status': order.status,
            'item_count': len(items_summary),
            'items': items_summary,
            'created_at': order.created_at.isoformat(),
        }
        
        # Log fulfillment preparation (warehouse systems would consume this)
        logger.info(
            f"Fulfillment prepared for Order #{order.id}",
            extra={'fulfillment_data': fulfillment_data}
        )
        
        return fulfillment_data
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for fulfillment preparation")
        # Don't retry - order doesn't exist
        return {'error': 'order_not_found', 'order_id': order_id}
        
    except Exception as exc:
        # Retry on transient failures
        logger.warning(
            f"Fulfillment preparation failed for Order #{order_id}, retrying",
            exc_info=True
        )
        raise self.retry(exc=exc)


def dispatch_order_fulfillment(order_id):
    """
    Dispatch fulfillment task after order transaction commits.
    
    This function should be called from within a transaction.atomic() block
    using transaction.on_commit() to ensure the task is only dispatched
    after the order successfully commits to the database.
    
    Args:
        order_id: Primary key of the Order to prepare
        
    Example:
        with transaction.atomic():
            order = Order.objects.create(...)
            transaction.on_commit(
                lambda: dispatch_order_fulfillment(order.id)
            )
    """
    try:
        prepare_order_fulfillment.apply_async(args=[order_id])
        logger.info(f"Dispatched fulfillment task for Order #{order_id}")
    except Exception as exc:
        # Log failure but don't crash the request
        # The order was successfully created; task dispatch is best-effort
        logger.error(
            f"Failed to dispatch fulfillment task for Order #{order_id}",
            exc_info=True
        )
