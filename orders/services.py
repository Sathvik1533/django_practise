
from django.db import transaction

from inventory.models import Inventory
from orders.models import Order, OrderItem


class OrderCreationError(Exception):
    """Raised when an order cannot be created."""


def validate_order_items(items):
    """Validate the structure and quantities of requested items."""

    if not isinstance(items, list) or not items:
        raise OrderCreationError(
            "An order must contain at least one item."
        )

    validated_items = []
    seen_product_ids = set()

    for item in items:
        if not isinstance(item, dict):
            raise OrderCreationError(
                "Each item must be an object."
            )

        if set(item) != {"product_id", "quantity"}:
            raise OrderCreationError(
                "Each item must contain only product_id and quantity."
            )

        product_id = item["product_id"]
        quantity = item["quantity"]

        if (
            isinstance(product_id, bool)
            or not isinstance(product_id, int)
            or product_id <= 0
        ):
            raise OrderCreationError(
                "product_id must be a positive integer."
            )

        if (
            isinstance(quantity, bool)
            or not isinstance(quantity, int)
            or quantity <= 0
        ):
            raise OrderCreationError(
                "quantity must be a positive integer."
            )

        if product_id in seen_product_ids:
            raise OrderCreationError(
                f"Product {product_id} appears more than once."
            )

        seen_product_ids.add(product_id)

        validated_items.append({
            "product_id": product_id,
            "quantity": quantity,
        })

    return validated_items


def create_order(items):
    """
    Validate products, create an order, and reserve inventory.
    
    After successful order creation, dispatches a background task for
    fulfillment preparation via transaction.on_commit() to ensure the
    task only runs after the transaction commits.
    
    Returns:
        Order: The created order instance
    """

    validated_items = validate_order_items(items)

    product_ids = [
        item["product_id"] for item in validated_items
    ]

    requested_quantities = {
        item["product_id"]: item["quantity"]
        for item in validated_items
    }

    with transaction.atomic():

        # Step 1: Lock inventory rows.
        inventories = list(
            Inventory.objects
            .select_for_update()
            .select_related("product")
            .filter(product_id__in=product_ids)
            .order_by("product_id")
        )

        inventory_by_product_id = {
            inventory.product_id: inventory
            for inventory in inventories
        }

        # Step 2: Validate product availability and stock.
        for product_id in product_ids:
            inventory = inventory_by_product_id.get(product_id)

            if inventory is None:
                raise OrderCreationError(
                    f"Product {product_id} has no inventory record."
                )

            if not inventory.product.is_active:
                raise OrderCreationError(
                    f"Product {product_id} is inactive."
                )

            quantity = requested_quantities[product_id]

            if inventory.available_quantity < quantity:
                raise OrderCreationError(
                    f"Insufficient stock for product {product_id}."
                )

        # Step 3: Create the pending order.
        order = Order.objects.create(
            status=Order.Status.PENDING
        )

        # Step 4: Create order items and reserve inventory.
        for item in validated_items:
            inventory = inventory_by_product_id[item["product_id"]]
            quantity = item["quantity"]

            OrderItem.objects.create(
                order=order,
                product=inventory.product,
                quantity=quantity,
                unit_price=inventory.product.price,
            )

            inventory.quantity_reserved += quantity
            inventory.save(
                update_fields=["quantity_reserved"]
            )

        # Step 5: Dispatch background task after transaction commits.
        # Import here to avoid circular dependencies
        from orders.tasks import dispatch_order_fulfillment
        
        transaction.on_commit(
            lambda: dispatch_order_fulfillment(order.id)
        )

        # Step 6: Return the created order.
        return order
