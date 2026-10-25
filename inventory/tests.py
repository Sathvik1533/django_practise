from django.test import TestCase
from decimal import Decimal

from inventory.models import Product, Inventory


class ProductCatalogueAPITests(TestCase):
    """Tests for GET /api/products/ endpoint."""

    def test_inactive_product_excluded(self):
        product = Product.objects.create(name="Old Item", sku="OLD-001", price=Decimal("50.00"), is_active=False)
        Inventory.objects.create(product=product, quantity_on_hand=10, quantity_reserved=0)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 0)

    def test_active_product_with_stock_appears(self):
        product = Product.objects.create(name="Laptop", sku="LAP-001", price=Decimal("1000.00"), is_active=True)
        Inventory.objects.create(product=product, quantity_on_hand=10, quantity_reserved=0)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], product.id)
        self.assertEqual(data[0]["name"], "Laptop")
        self.assertEqual(data[0]["available_quantity"], 10)

    def test_empty_catalogue_returns_empty_array(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_response_excludes_raw_inventory_fields(self):
        product = Product.objects.create(name="Tablet", sku="TAB-001", price=Decimal("300.00"), is_active=True)
        Inventory.objects.create(product=product, quantity_on_hand=10, quantity_reserved=0)
        data = self.client.get("/api/products/").json()[0]
        self.assertEqual(set(data.keys()), {"id", "name", "price", "available_quantity"})

    def test_reserved_quantity_reflected(self):
        product = Product.objects.create(name="Phone", sku="PHN-001", price=Decimal("500.00"), is_active=True)
        Inventory.objects.create(product=product, quantity_on_hand=10, quantity_reserved=3)
        response = self.client.get("/api/products/")
        self.assertEqual(response.json()[0]["available_quantity"], 7)

    def test_multiple_products_all_appear(self):
        p1 = Product.objects.create(name="Item A", sku="A-001", price=Decimal("10.00"), is_active=True)
        p2 = Product.objects.create(name="Item B", sku="B-001", price=Decimal("20.00"), is_active=True)
        Inventory.objects.create(product=p1, quantity_on_hand=5, quantity_reserved=0)
        Inventory.objects.create(product=p2, quantity_on_hand=8, quantity_reserved=2)
        response = self.client.get("/api/products/")
        data = response.json()
        self.assertEqual(len(data), 2)
        names = {item["name"] for item in data}
        self.assertEqual(names, {"Item A", "Item B"})

    def test_price_serialized_as_string(self):
        product = Product.objects.create(name="Widget", sku="WDG-001", price=Decimal("99.99"), is_active=True)
        Inventory.objects.create(product=product, quantity_on_hand=10, quantity_reserved=0)
        data = self.client.get("/api/products/").json()[0]
        self.assertEqual(data["price"], "99.99")
        self.assertIsInstance(data["price"], str)
