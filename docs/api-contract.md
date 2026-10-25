# API Contract

**Version:** 1.0  
**Last Updated:** 2024-10-24  
**Database:** MySQL (`ecommerce_logistics`)

This document describes the actual implementation of all HTTP endpoints exposed by the Django E-commerce Logistics backend.

---

## Base URL

**Local Development:**
```
http://localhost:8000
```

**Authentication:** None currently implemented. All endpoints are publicly accessible.

---

## Endpoints

### 1. Health Check

**Purpose:** Verify that the application server is running and responding to requests.

```http
GET /health/
```

**Request:**
- No headers required
- No request body

**Success Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Notes:**
- This endpoint does not verify database connectivity
- Used for load balancer health checks and basic liveness verification

---

### 2. Product Catalogue

**Purpose:** Retrieve all active products with available inventory for display in the frontend.

```http
GET /api/products/
```

**Request:**
- No authentication required
- No query parameters
- No request body

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
    "available_quantity": 45
  }
]
```

**Response Schema:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Product primary key |
| `name` | string | Product name (max 200 chars) |
| `price` | string | Decimal as string to preserve precision (e.g., `"1500.00"`) |
| `available_quantity` | integer | Computed as `quantity_on_hand - quantity_reserved` |

**Filtering Behavior:**

Products are **included** if:
- `Product.is_active = True`
- Product has a related `Inventory` record (OneToOne relationship)

Products are **excluded** if:
- `Product.is_active = False`
- Product has no `Inventory` record
- There is no minimum stock filter — products with `available_quantity = 0` are included

**Implementation Details:**
- Computed field `available_quantity` is annotated at query time using Django `F()` expressions
- Raw inventory fields (`quantity_on_hand`, `quantity_reserved`) are never exposed to clients
- Response is a bare JSON array, no pagination wrapper
- Uses `ListAPIView` from Django REST Framework

**Error Responses:**

This endpoint has no expected error conditions. If no products match the criteria, it returns an empty array `[]` with status 200.

---

### 3. Order Creation

**Purpose:** Create a new order with multiple line items, validate stock availability, snapshot product prices, and atomically reserve inventory.

```http
POST /api/orders/
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 3, "quantity": 1}
  ]
}
```

**Request Schema:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `items` | array | Yes | Must be non-empty array of objects |
| `items[].product_id` | integer | Yes | Positive integer, must reference existing Product |
| `items[].quantity` | integer | Yes | Positive integer (> 0) |

**Important:** The frontend must send **only** `product_id` and `quantity`. Do not send `unit_price`, `line_total`, `total`, or any other computed fields. The backend determines all pricing from the database at order-creation time.

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
      "product_id": 3,
      "quantity": 1,
      "unit_price": "25.50",
      "line_total": "25.50"
    }
  ],
  "total": "3025.50",
  "created_at": "2024-10-24T14:23:45.123456Z"
}
```

**Success Response Schema:**

| Field | Type | Description |
|---|---|---|
| `order_id` | integer | Order primary key |
| `status` | string | Order status enum: `"pending"`, `"confirmed"`, `"cancelled"` |
| `items` | array | Array of order line items |
| `items[].product_id` | integer | Product FK |
| `items[].quantity` | integer | Quantity ordered |
| `items[].unit_price` | string | Price snapshot from `Product.price` at order time |
| `items[].line_total` | string | Computed as `quantity × unit_price` |
| `total` | string | Sum of all `line_total` values |
| `created_at` | string | ISO 8601 timestamp with microseconds |

**Validation Error Responses (400 Bad Request):**

**Case 1: Missing or malformed request structure**
```json
{
  "items": ["This field is required."]
}
```

**Case 2: Empty items array**
```json
{
  "error": "An order must contain at least one item."
}
```

**Case 3: Invalid field in item**
```json
{
  "error": "Each item must contain only product_id and quantity."
}
```
*Triggered when client sends extra fields like `unit_price`, `line_total`, etc.*

**Case 4: Invalid product_id**
```json
{
  "error": "product_id must be a positive integer."
}
```

**Case 5: Invalid quantity**
```json
{
  "error": "quantity must be a positive integer."
}
```

**Case 6: Duplicate products**
```json
{
  "error": "Product 5 appears more than once."
}
```

**Case 7: Product does not exist**
```json
{
  "error": "Product 99 has no inventory record."
}
```
*This error is returned when the product_id references a non-existent Product or a Product without an Inventory record.*

**Case 8: Inactive product**
```json
{
  "error": "Product 7 is inactive."
}
```

**Case 9: Insufficient stock**
```json
{
  "error": "Insufficient stock for product 3."
}
```

**Transaction and Atomicity Guarantees:**

1. **Row-level locking:** Inventory rows are locked using `SELECT ... FOR UPDATE` ordered by `product_id` to prevent deadlocks
2. **Atomic transaction:** All operations occur within `transaction.atomic()`:
   - Order creation
   - OrderItem creation with price snapshot
   - Inventory reservation (`quantity_reserved += quantity`)
3. **Rollback on error:** If any validation fails or stock is insufficient, the entire transaction rolls back — no partial orders are created
4. **Check constraints:** Database enforces `quantity_reserved <= quantity_on_hand` via CHECK constraint `reserved_lte_on_hand`

**Price Snapshot Behavior:**

The `OrderItem.unit_price` field captures `Product.price` at the exact moment the order is created. This value:
- Is never updated when the Product price changes later
- Preserves the historical price for audit and accounting
- Is the authoritative source of truth for order totals

**Concurrency Safety:**

The implementation uses `select_for_update()` to acquire row-level locks on Inventory records, ordered by `product_id` to prevent deadlocks. This ensures that:
- Two concurrent orders cannot oversell the same product
- Inventory reservations are serialized per product

**Limitations:**
- Concurrent safety has **not been stress-tested** with high-concurrency scenarios
- The database constraint `reserved_lte_on_hand` acts as a final safety net
- No explicit concurrency tests exist in the test suite

---

## CORS Configuration

The backend is configured to accept cross-origin requests from the following origins:

```
http://localhost:3000
http://127.0.0.1:3000
```

**Headers automatically included in CORS responses:**
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

Frontend developers can use:
1. Direct API calls (CORS headers handle the browser preflight)
2. Vite dev proxy: proxy `/api` → `http://localhost:8000` to avoid CORS entirely

---

## Error Response Format

**DRF Serializer Errors (400):**
```json
{
  "field_name": ["Error message here."]
}
```

**Business Logic Errors (400):**
```json
{
  "error": "Human-readable error message"
}
```

**Unexpected Server Errors (500):**

Django/DRF default error handling applies. In production, these should be logged and a generic error response returned.

---

## Future Additions

**Not yet implemented:**
- JWT authentication (all endpoints currently public)
- Rate limiting
- Pagination for product list
- Order history retrieval
- Order cancellation
- Celery background tasks
- Redis caching

When JWT is added, all API endpoints except `/health/` will require an `Authorization: Bearer <token>` header.

---

## Testing

All endpoints are covered by automated tests in:
- `inventory/tests.py` — 7 tests for `GET /api/products/`
- `orders/tests.py` — 18 tests for `POST /api/orders/`

Tests run against MySQL (`test_ecommerce_logistics` database) using Django's `TestCase`.

**Run tests:**
```bash
poetry run python manage.py test
```

---

## Migration History

**Inventory:**
- `inventory/migrations/0001_initial.py` — Product and Inventory models with CHECK constraint

**Orders:**
- `orders/migrations/0001_initial.py` — Order and OrderItem models with CHECK constraints

All migrations are applied. Run `poetry run python manage.py showmigrations` to verify.
