# Frontend Integration Guide

**Audience:** Antigravity (React frontend team)  
**Backend Base URL:** `http://localhost:8000`  
**Frontend Expected URL:** `http://localhost:3000`

This document provides everything needed to integrate the React frontend with the Django backend API.

---

## Quick Start

### 1. Start the Backend

**Prerequisites:**
- Python 3.13
- Poetry
- MySQL 8.0+ running locally
- Environment variables configured in `.env`

**Steps:**
```bash
# Navigate to project root
cd /path/to/ecommerce-logistics-platform

# Install dependencies
poetry install

# Apply migrations (first time only)
poetry run python manage.py migrate

# Start the development server
poetry run python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

**Verify it's running:**
```bash
curl http://localhost:8000/health/
# Expected: {"status":"ok"}
```

### 2. Initialize Test Data

**Create sample products:**
```bash
poetry run python manage.py shell
```

```python
from inventory.models import Product, Inventory
from decimal import Decimal

# Product 1
p1 = Product.objects.create(
    name="Test Laptop",
    sku="LAP-001",
    price=Decimal("1500.00"),
    is_active=True
)
Inventory.objects.create(
    product=p1,
    quantity_on_hand=100,
    quantity_reserved=0
)

# Product 2
p2 = Product.objects.create(
    name="Wireless Mouse",
    sku="MOU-001",
    price=Decimal("25.50"),
    is_active=True
)
Inventory.objects.create(
    product=p2,
    quantity_on_hand=50,
    quantity_reserved=0
)

# Product 3 (low stock for testing)
p3 = Product.objects.create(
    name="USB Cable",
    sku="CAB-001",
    price=Decimal("9.99"),
    is_active=True
)
Inventory.objects.create(
    product=p3,
    quantity_on_hand=2,
    quantity_reserved=0
)

print(f"Created {Product.objects.count()} products")
```

Exit the shell with `exit()`.

---

## API Endpoints

### Base URL

All API endpoints are prefixed with `/api/`:

```
http://localhost:8000/api/products/
http://localhost:8000/api/orders/
```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

You can make direct fetch/axios calls from React without proxy configuration. However, using a Vite proxy is recommended to avoid CORS complexity.

**Vite Proxy Configuration (Recommended):**

```javascript
// vite.config.js
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
};
```

With this proxy, make API calls to `/api/products/` and `/api/orders/` (relative URLs). Vite will forward them to Django.

---

## Endpoint 1: Fetch Products

**Purpose:** Display all available products with prices and stock levels.

```http
GET /api/products/
```

**Request Example (fetch):**
```javascript
const response = await fetch('http://localhost:8000/api/products/');
const products = await response.json();
```

**Request Example (with Vite proxy):**
```javascript
const response = await fetch('/api/products/');
const products = await response.json();
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Test Laptop",
    "price": "1500.00",
    "available_quantity": 100
  },
  {
    "id": 2,
    "name": "Wireless Mouse",
    "price": "25.50",
    "available_quantity": 50
  }
]
```

**Field Types:**
- `id`: number (integer)
- `name`: string
- `price`: string (always two decimal places, e.g., `"1500.00"`)
- `available_quantity`: number (integer, can be 0)

**Important:** `price` is a string to preserve decimal precision. Convert to number only for display calculations. Never send price back to the backend.

**Empty Response:**
If no products are available, the response is an empty array:
```json
[]
```

**Error Handling:**
This endpoint has no expected error conditions. If the request fails, it's a network or server error.

**Example React Hook:**
```javascript
import { useState, useEffect } from 'react';

function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load products');
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { products, loading, error };
}
```

---

## Endpoint 2: Create Order

**Purpose:** Submit an order with multiple products.

```http
POST /api/orders/
Content-Type: application/json
```

**Request Body Schema:**
```json
{
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 3, "quantity": 1}
  ]
}
```

**CRITICAL: Do NOT send `unit_price`, `line_total`, `total`, or any other computed fields.** The backend determines all pricing from the database. If you send extra fields, the order will be rejected with a 400 error.

**Valid Fields (per item):**
- `product_id` (number, required): Must match a product ID from `GET /api/products/`
- `quantity` (number, required): Positive integer

**Request Example (fetch):**
```javascript
const orderData = {
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 2, quantity: 1 },
  ],
};

const response = await fetch('http://localhost:8000/api/orders/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData),
});

if (!response.ok) {
  const error = await response.json();
  console.error('Order failed:', error);
} else {
  const order = await response.json();
  console.log('Order created:', order);
}
```

**Request Example (with Vite proxy):**
```javascript
const response = await fetch('/api/orders/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: [...] }),
});
```

**Success Response (201 Created):**
```json
{
  "order_id": 42,
  "status": "pending",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": "1500.00",
      "line_total": "3000.00"
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": "25.50",
      "line_total": "25.50"
    }
  ],
  "total": "3025.50",
  "created_at": "2024-10-24T14:23:45.123456Z"
}
```

**Success Response Fields:**
- `order_id`: number (save this for order confirmation display)
- `status`: string (`"pending"`, `"confirmed"`, or `"cancelled"`)
- `items`: array of order line items
  - `product_id`: number (matches your request)
  - `quantity`: number (matches your request)
  - `unit_price`: string (price snapshot from database)
  - `line_total`: string (computed as `quantity × unit_price`)
- `total`: string (sum of all `line_total` values)
- `created_at`: ISO 8601 timestamp

**Use the response values for display, not your local calculations.** The backend is the source of truth for pricing.

**Error Responses (400 Bad Request):**

**1. Missing items field:**
```json
{
  "items": ["This field is required."]
}
```

**2. Empty items array:**
```json
{
  "error": "An order must contain at least one item."
}
```

**3. Invalid item structure (extra fields):**
```json
{
  "error": "Each item must contain only product_id and quantity."
}
```

**4. Duplicate products:**
```json
{
  "error": "Product 5 appears more than once."
}
```

**5. Product not found / no inventory:**
```json
{
  "error": "Product 99 has no inventory record."
}
```

**6. Product is inactive:**
```json
{
  "error": "Product 7 is inactive."
}
```

**7. Insufficient stock:**
```json
{
  "error": "Insufficient stock for product 3."
}
```

**Error Handling Example:**
```javascript
try {
  const response = await fetch('/api/orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Check for DRF validation error (object with field keys)
    if (data.items) {
      alert(`Validation error: ${data.items.join(', ')}`);
    }
    // Check for business logic error (object with "error" key)
    else if (data.error) {
      alert(`Order failed: ${data.error}`);
    }
    // Unexpected error format
    else {
      alert('Order failed with unknown error');
    }
    return;
  }

  // Success
  console.log('Order created:', data.order_id);
  displayOrderConfirmation(data);
} catch (err) {
  // Network error
  alert('Network error: Could not reach server');
}
```

---

## Endpoint 3: Health Check

**Purpose:** Verify the backend is running.

```http
GET /health/
```

**Success Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Use Case:** Display a connection status indicator in your UI, or check backend availability before loading the app.

---

## Frontend Development Workflow

### 1. Start Backend First
```bash
# Terminal 1
cd ecommerce-logistics-platform
poetry run python manage.py runserver
```

### 2. Verify Backend
```bash
curl http://localhost:8000/health/
curl http://localhost:8000/api/products/
```

### 3. Start Frontend
```bash
# Terminal 2
cd frontend
npm install
npm run dev
```

Vite should start on `http://localhost:3000`. The proxy will forward `/api/*` requests to `localhost:8000`.

---

## Testing Your Integration

### Test 1: Fetch Products

**curl:**
```bash
curl http://localhost:8000/api/products/
```

**Expected:** JSON array of products (or empty array if no products exist).

### Test 2: Create Order (Success)

**curl:**
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2}
    ]
  }'
```

**Expected:** 201 response with `order_id`, `status`, `items`, `total`, `created_at`.

### Test 3: Create Order (Insufficient Stock)

First, order more than available:
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 999}
    ]
  }'
```

**Expected:** 400 response with:
```json
{
  "error": "Insufficient stock for product 1."
}
```

### Test 4: Verify Order Persistence

**Check the database:**
```bash
poetry run python manage.py shell
```

```python
from orders.models import Order, OrderItem
from inventory.models import Inventory

# View the last order
order = Order.objects.last()
print(f"Order ID: {order.id}, Status: {order.status}")

# View order items
for item in order.items.all():
    print(f"  - {item.product.name} x {item.quantity} @ {item.unit_price}")

# Verify inventory was reserved
inv = Inventory.objects.get(product_id=1)
print(f"Product 1: on_hand={inv.quantity_on_hand}, reserved={inv.quantity_reserved}")
```

**Expected:** You should see `quantity_reserved` increased by the ordered quantity.

---

## Data Flow

**Order Creation Flow:**

1. User selects products and quantities in React UI
2. Frontend builds `{items: [{product_id, quantity}, ...]}` payload
3. Frontend sends `POST /api/orders/` with JSON body
4. Django validates request structure (DRF serializer)
5. Service layer validates business rules:
   - All products exist and have inventory
   - All products are active
   - Sufficient stock available
6. Database transaction:
   - Lock inventory rows (`SELECT ... FOR UPDATE`)
   - Create Order record
   - Create OrderItem records with price snapshots
   - Increment `quantity_reserved` in Inventory
7. Transaction commits or rolls back atomically
8. Backend returns 201 with order details
9. Frontend displays order confirmation

**What Gets Stored in the Database:**

- Order record with `status = 'pending'`
- OrderItem records with `unit_price` copied from `Product.price`
- Inventory records with updated `quantity_reserved`

**What Does NOT Get Stored:**

- Frontend-calculated totals (they are recomputed in the backend)
- Client-provided prices (ignored if sent)

---

## Known Limitations and Future Features

### Not Yet Implemented:

1. **JWT Authentication:**
   - All endpoints are currently public
   - When JWT is added, you will need to:
     - Add a login screen
     - Store the JWT access token (e.g., in localStorage)
     - Include `Authorization: Bearer <token>` header in all API requests

2. **Order History:**
   - No `GET /api/orders/` endpoint yet
   - Cannot retrieve past orders

3. **Order Cancellation:**
   - No `DELETE /api/orders/{id}/` endpoint
   - Inventory is not un-reserved

4. **Pagination:**
   - Product list returns all products
   - Will need pagination when product count grows

5. **Background Tasks (Celery):**
   - No email confirmations or async processing yet

6. **Webhooks / Real-time Updates:**
   - No WebSocket or SSE support for inventory changes

### Assumptions:

- Products cannot be deleted while orders reference them (database constraint)
- Price changes to products do not affect existing orders (price snapshot)
- Concurrent orders are safe due to row-level locking (not stress-tested)

---

## Troubleshooting

### Backend Not Starting

**Error: `django.db.utils.OperationalError: (2003, "Can't connect to MySQL server...")`**

**Solution:**
- Ensure MySQL is running: `brew services start mysql` (macOS) or `sudo systemctl start mysql` (Linux)
- Verify `.env` credentials: `DB_USER`, `DB_PASSWORD`, `DB_HOST`
- Test connection: `mysql -u <user> -p -h 127.0.0.1`

**Error: `django.db.utils.ProgrammingError: (1146, "Table 'ecommerce_logistics.inventory_product' doesn't exist")`**

**Solution:**
- Run migrations: `poetry run python manage.py migrate`

### CORS Errors in Browser Console

**Error: `Access to fetch at 'http://localhost:8000/api/products/' from origin 'http://localhost:3000' has been blocked by CORS policy`**

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` in Django settings includes `http://localhost:3000`
- **OR** Use Vite proxy configuration (see above)

### Empty Product List

**curl returns `[]`:**

**Cause:** No products in the database, or products are inactive/have no inventory.

**Solution:**
- Create test products using the shell script above
- Verify products exist: `poetry run python manage.py shell`, then `Product.objects.count()`

### Order Creation Returns 400

**Error: `"Each item must contain only product_id and quantity."`**

**Cause:** You sent extra fields like `unit_price`, `line_total`, or `price`.

**Solution:** Send only `product_id` and `quantity`. Remove all computed fields from the request.

### Order Creation Returns Insufficient Stock (Unexpected)

**Cause:** A previous test order reserved the inventory.

**Solution:** Reset inventory:
```bash
poetry run python manage.py shell
```
```python
from inventory.models import Inventory
Inventory.objects.update(quantity_reserved=0)
```

---

## Contact

For backend questions, database issues, or API clarifications, contact the backend team (you).

For frontend implementation, React components, or UI/UX, contact Antigravity.

---

## Appendix: Complete curl Test Script

Save this as `test-api.sh`:
```bash
#!/bin/bash
set -e

echo "=== Testing Django E-commerce API ==="

echo "1. Health check..."
curl -s http://localhost:8000/health/ | jq .

echo "\n2. Fetch products..."
curl -s http://localhost:8000/api/products/ | jq .

echo "\n3. Create valid order..."
curl -s -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 1}
    ]
  }' | jq .

echo "\n4. Test insufficient stock (expecting 400)..."
curl -s -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 9999}
    ]
  }' | jq .

echo "\n=== All tests complete ==="
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

**Last Updated:** 2024-10-24  
**Backend Version:** 1.0  
**Django Version:** 6.1  
**DRF Version:** 3.18.3
