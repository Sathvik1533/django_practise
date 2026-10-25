
from django.test import SimpleTestCase

from orders.services import OrderCreationError, validate_order_items


class ValidateOrderItemsTests(SimpleTestCase):
    def test_accepts_valid_items(self):
        items = [
            {"product_id": 1, "quantity": 2},
            {"product_id": 3, "quantity": 1},
        ]

        result = validate_order_items(items)

        self.assertEqual(result, items)

    def test_rejects_empty_items(self):
        with self.assertRaises(OrderCreationError):
            validate_order_items([])

    def test_rejects_zero_quantity(self):
        with self.assertRaises(OrderCreationError):
            validate_order_items([{"product_id": 1, "quantity": 0}])

    def test_rejects_invalid_product_id(self):
        with self.assertRaises(OrderCreationError):
            validate_order_items([{"product_id": 0, "quantity": 1}])

    def test_rejects_duplicate_products(self):
        items = [
            {"product_id": 1, "quantity": 1},
            {"product_id": 1, "quantity": 2},
        ]

        with self.assertRaises(OrderCreationError):
            validate_order_items(items)

    def test_rejects_client_supplied_price(self):
        items = [{"product_id": 1, "quantity": 1, "unit_price": "1.00"}]

        with self.assertRaises(OrderCreationError):
            validate_order_items(items)


from django.test import TestCase
from decimal import Decimal

from inventory.models import Product, Inventory
from orders.models import Order, OrderItem
from orders.services import create_order


class CreateOrderTests(TestCase):
    """Database tests for order creation with inventory reservation."""

    def test_successful_order_creation(self):
        """Test that create_order creates Order, OrderItems, and reserves inventory."""
        # Setup: Create test data
        product = Product.objects.create(
            name="Laptop",
            sku="LAP-001",
            price=Decimal("1000.00"),
            is_active=True,
        )
        inventory = Inventory.objects.create(
            product=product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        # Action: Create an order
        order = create_order([
            {"product_id": product.id, "quantity": 3}
        ])

        # Assertions: Verify Order was created
        self.assertIsNotNone(order.id)
        self.assertEqual(order.status, Order.Status.PENDING)
        
        # Assertions: Verify OrderItem was created with correct values
        order_items = order.items.all()
        self.assertEqual(order_items.count(), 1)
        
        item = order_items.first()
        self.assertEqual(item.product_id, product.id)
        self.assertEqual(item.quantity, 3)
        self.assertEqual(item.unit_price, Decimal("1000.00"))
        
        # Assertions: Verify inventory was reserved
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity_reserved, 3)
        self.assertEqual(inventory.available_quantity, 7)

    def test_insufficient_stock_raises_error(self):
        """Test that orders exceeding available stock are rejected."""
        # Setup: Create product with limited stock
        product = Product.objects.create(
            name="Phone",
            sku="PHONE-001",
            price=Decimal("500.00"),
            is_active=True,
        )
        inventory = Inventory.objects.create(
            product=product,
            quantity_on_hand=5,
            quantity_reserved=2,  # Only 3 available
        )

        # Action & Assertion: Verify error is raised
        with self.assertRaisesMessage(
            OrderCreationError,
            f"Insufficient stock for product {product.id}"
        ):
            create_order([{"product_id": product.id, "quantity": 4}])

        # Assertions: Verify nothing was changed
        self.assertEqual(Order.objects.count(), 0)  # No order created
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity_reserved, 2)  # Unchanged

    def test_inactive_product_raises_error(self):
        """Test that orders for inactive products are rejected."""
        # Setup: Create inactive product
        product = Product.objects.create(
            name="Discontinued Item",
            sku="DISC-001",
            price=Decimal("100.00"),
            is_active=False,  # Product is disabled
        )
        inventory = Inventory.objects.create(
            product=product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        # Action & Assertion: Verify error is raised
        with self.assertRaisesMessage(
            OrderCreationError,
            f"Product {product.id} is inactive"
        ):
            create_order([{"product_id": product.id, "quantity": 1}])

        # Assertions: Verify nothing was changed
        self.assertEqual(Order.objects.count(), 0)
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity_reserved, 0)

    def test_price_snapshot_behavior(self):
        """Test that OrderItem captures price at order time, not live reference."""
        # Setup: Create product
        product = Product.objects.create(
            name="Tablet",
            sku="TAB-001",
            price=Decimal("300.00"),
            is_active=True,
        )
        inventory = Inventory.objects.create(
            product=product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        # Action: Create order at original price
        order = create_order([{"product_id": product.id, "quantity": 1}])

        # Get the OrderItem
        item = order.items.first()
        self.assertEqual(item.unit_price, Decimal("300.00"))

        # Change product price
        product.price = Decimal("400.00")
        product.save()

        # Reload product to verify price changed
        product.refresh_from_db()
        self.assertEqual(product.price, Decimal("400.00"))

        # Reload OrderItem to verify price is UNCHANGED (snapshot preserved)
        item.refresh_from_db()
        self.assertEqual(item.unit_price, Decimal("300.00"))  # Still original price


class OrderCreateAPITests(TestCase):
    """API integration tests for POST /api/orders/ endpoint."""

    def test_successful_order_creation_returns_201(self):
        """Test that a valid request creates an order and returns 201 Created."""
        # Setup: Create products with inventory
        product1 = Product.objects.create(
            name="Laptop",
            sku="LAP-001",
            price=Decimal("1000.00"),
            is_active=True,
        )
        product2 = Product.objects.create(
            name="Mouse",
            sku="MOUSE-001",
            price=Decimal("25.50"),
            is_active=True,
        )
        Inventory.objects.create(
            product=product1,
            quantity_on_hand=10,
            quantity_reserved=0,
        )
        Inventory.objects.create(
            product=product2,
            quantity_on_hand=20,
            quantity_reserved=0,
        )

        # Action: POST request to create order
        response = self.client.post(
            "/api/orders/",
            data={
                "items": [
                    {"product_id": product1.id, "quantity": 2},
                    {"product_id": product2.id, "quantity": 3},
                ]
            },
            content_type="application/json",
        )

        # Assertions: Verify response
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertIn("order_id", data)
        self.assertEqual(data["status"], "pending")
        self.assertEqual(len(data["items"]), 2)
        
        # Verify item 1 (Laptop)
        item1 = next(i for i in data["items"] if i["product_id"] == product1.id)
        self.assertEqual(item1["quantity"], 2)
        self.assertEqual(item1["unit_price"], "1000.00")
        self.assertEqual(item1["line_total"], "2000.00")
        
        # Verify item 2 (Mouse)
        item2 = next(i for i in data["items"] if i["product_id"] == product2.id)
        self.assertEqual(item2["quantity"], 3)
        self.assertEqual(item2["unit_price"], "25.50")
        self.assertEqual(item2["line_total"], "76.50")
        
        # Verify total
        self.assertEqual(data["total"], "2076.50")
        
        # Assertions: Verify database changes
        self.assertEqual(Order.objects.count(), 1)
        order = Order.objects.first()
        self.assertEqual(order.items.count(), 2)
        
        # Verify inventory was reserved
        product1.inventory.refresh_from_db()
        self.assertEqual(product1.inventory.quantity_reserved, 2)
        
        product2.inventory.refresh_from_db()
        self.assertEqual(product2.inventory.quantity_reserved, 3)

    def test_invalid_request_returns_400(self):
        """Test that invalid request structure returns 400 with error details."""
        # Action: POST with missing required field
        response = self.client.post(
            "/api/orders/",
            data={"wrong_field": "value"},
            content_type="application/json",
        )

        # Assertions
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("items", data)

    def test_empty_items_returns_400(self):
        """Test that empty items list returns 400."""
        response = self.client.post(
            "/api/orders/",
            data={"items": []},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_duplicate_products_returns_400(self):
        """Test that duplicate product_ids in request returns 400."""
        product = Product.objects.create(
            name="Laptop",
            sku="LAP-001",
            price=Decimal("1000.00"),
            is_active=True,
        )
        Inventory.objects.create(
            product=product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        response = self.client.post(
            "/api/orders/",
            data={
                "items": [
                    {"product_id": product.id, "quantity": 1},
                    {"product_id": product.id, "quantity": 2},
                ]
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("items", data)

    def test_insufficient_stock_returns_400(self):
        """Test that insufficient stock returns 400 with appropriate error."""
        product = Product.objects.create(
            name="Phone",
            sku="PHONE-001",
            price=Decimal("500.00"),
            is_active=True,
        )
        Inventory.objects.create(
            product=product,
            quantity_on_hand=5,
            quantity_reserved=2,  # Only 3 available
        )

        response = self.client.post(
            "/api/orders/",
            data={"items": [{"product_id": product.id, "quantity": 4}]},
            content_type="application/json",
        )

        # Assertions
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("Insufficient stock", data["error"])
        
        # Verify no order was created
        self.assertEqual(Order.objects.count(), 0)
        
        # Verify inventory unchanged
        product.inventory.refresh_from_db()
        self.assertEqual(product.inventory.quantity_reserved, 2)

    def test_inactive_product_returns_400(self):
        """Test that inactive product returns 400 with appropriate error."""
        product = Product.objects.create(
            name="Discontinued",
            sku="DISC-001",
            price=Decimal("100.00"),
            is_active=False,
        )
        Inventory.objects.create(
            product=product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        response = self.client.post(
            "/api/orders/",
            data={"items": [{"product_id": product.id, "quantity": 1}]},
            content_type="application/json",
        )

        # Assertions
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("inactive", data["error"])
        
        # Verify no order was created
        self.assertEqual(Order.objects.count(), 0)

    def test_missing_product_returns_400(self):
        """Test that non-existent product returns 400."""
        response = self.client.post(
            "/api/orders/",
            data={"items": [{"product_id": 99999, "quantity": 1}]},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        
        # Verify no order was created
        self.assertEqual(Order.objects.count(), 0)

    def test_backend_determines_price_not_client(self):
        """Test that unit_price comes from backend, not client request."""
        product = Product.objects.create(
            name="Tablet",
            sku="TAB-001",
            price=Decimal("300.00"),
            is_active=True,
        )
        Inventory.objects.create(
            product=product,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        # Action: Try to send a price in the request (DRF ignores extra fields)
        response = self.client.post(
            "/api/orders/",
            data={
                "items": [
                    {
                        "product_id": product.id,
                        "quantity": 1,
                        "unit_price": "1.00"  # Client tries to set $1 price
                    }
                ]
            },
            content_type="application/json",
        )

        # Assertion: Order succeeds with BACKEND price, not client price
        self.assertEqual(response.status_code, 201)
        data = response.json()
        
        # Verify the backend price ($300) was used, NOT the client's $1
        item = data["items"][0]
        self.assertEqual(item["unit_price"], "300.00")
        self.assertEqual(item["line_total"], "300.00")
        self.assertEqual(data["total"], "300.00")
        
        # Verify database also has backend price
        order = Order.objects.first()
        order_item = order.items.first()
        self.assertEqual(order_item.unit_price, Decimal("300.00"))
