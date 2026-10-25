# PRD — Django E-Commerce Logistics Engine

## 1. Product Objective

Build a backend API for an e-commerce logistics system that lets customers
place orders, reserves stock safely under concurrent load, and records a
price snapshot at the time of purchase. A React frontend will consume this API.

The project is also a deliberate learning exercise in full-stack vertical slice
architecture, service layer design, database transactions, and row-level locking.

---

## 2. Users

| User | Role |
|---|---|
| Customer | Browses products, places orders via React UI |
| Admin | Manages products and inventory via Django Admin |
| Developer | Reads this document and builds the system |

---

## 3. Business Problem

Without safe stock reservation, two customers can order the same last item
simultaneously and both succeed — overselling. The system must prevent this
using database-level row locking, not application-level flags or caches.

Without a price snapshot, a product price change after order creation would
retroactively change the customer's receipt. The system must store the price
at order time permanently on the OrderItem record.

---

## 4. Functional Requirements

### FR-1 — Order Creation
- A client can POST a list of product IDs and quantities to `POST /api/orders/`.
- The backend validates the request structure (not empty, no duplicates, positive integers).
- The backend checks that every requested product exists, is active, and has sufficient stock.
- The backend creates an Order record, one OrderItem per product, and reserves inventory.
- All of the above happen inside a single database transaction (all or nothing).
- The response includes order ID, status, items with unit prices, and order total.

### FR-2 — Stock Reservation
- Available stock = `quantity_on_hand - quantity_reserved`.
- When an order is created, `quantity_reserved` is incremented by the ordered quantity.
- The database check constraint `reserved_lte_on_hand` enforces `reserved <= on_hand` at all times.
- Row-level locks (`SELECT ... FOR UPDATE`) prevent two concurrent transactions from both reading the same available quantity and both reserving it (overselling).
- Locks are acquired in `product_id` order to prevent deadlocks.

### FR-3 — Price Snapshot
- `OrderItem.unit_price` is set from `Product.price` at the moment the order is created.
- It is never updated after creation.
- Changing a product price after order creation must not affect existing OrderItem records.
- The backend never accepts a price from the client request.

### FR-4 — Product Catalogue (read-only from order perspective)
- `Product`: name, sku (unique), price, is_active, created_at.
- `Inventory`: one-to-one with Product, quantity_on_hand, quantity_reserved.
- Inactive products cannot be ordered even if they have stock.
- Products with no inventory record cannot be ordered.

### FR-5 — Health Check
- `GET /health/` returns `{"status": "ok"}` with HTTP 200.
- Used by load balancers and deployment tooling to verify the service is up.

### FR-6 — Authentication (planned, not implemented)
- Order creation must require an authenticated user (JWT).
- A user may only view their own orders.
- Authentication does not replace database locking for concurrency safety.

### FR-7 — Background Tasks (planned, not implemented)
- After a successful order commit, a confirmation email task should be dispatched.
- The task must be dispatched using `transaction.on_commit()` so it only fires
  after the database transaction has been committed — not inside the transaction.
- Celery with a Redis broker will handle task execution.
- If the task fails it must be retried with exponential back-off.
- Duplicate task delivery is possible; tasks must be idempotent.

---

## 5. Non-Functional Requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-1 | All secrets in environment variables, never in source code | Partial (SECRET_KEY still has insecure fallback) |
| NFR-2 | `.env.example` documents every required variable | Done |
| NFR-3 | MySQL with InnoDB for row-level locking | Done |
| NFR-4 | Connection pooling to avoid per-request connection overhead | Done |
| NFR-5 | CORS configured to allow the React dev server origin | Done |
| NFR-6 | Business errors return HTTP 400 with `{"error": "..."}` | Done |
| NFR-7 | Unexpected server errors must not be swallowed as 400 | Done |
| NFR-8 | Tests run against MySQL, not SQLite | Done |
| NFR-9 | All test evidence reported with exact command and result | Done |

---

## 6. Error Handling Rules

| Situation | HTTP Status | Response shape |
|---|---|---|
| Invalid request structure | 400 | `{"items": ["This field is required."]}` |
| Business rule violation | 400 | `{"error": "Insufficient stock for product 5"}` |
| Unexpected server error | 500 | Django default (never catch-all to 400) |

---

## 7. Security Rules

- The client must never set `unit_price`. The serializer ignores extra fields; the service reads price from the database.
- `DEBUG=True` is acceptable in local development only. Production must set `DEBUG=False` via env var.
- `ALLOWED_HOSTS` must be set explicitly in production.
- CSRF protection is active for session-based views. DRF API views are exempt by default (stateless JSON API).
- SQL injection is prevented by always using the Django ORM (never raw string interpolation in queries).

---

## 8. MVP Scope

**In scope for MVP:**
- Order creation with stock reservation and price snapshot
- Input validation (structure and business rules)
- MySQL with row-level locking
- DRF REST API
- React frontend order form (planned)
- CORS configuration
- Health check endpoint

**Explicitly out of scope for MVP:**
- User authentication and JWT
- Celery and Redis background jobs
- Order cancellation or fulfilment
- Payment processing
- Product browsing or search API
- Admin inventory management API
- Deployment (Gunicorn, Nginx, Docker)

---

## 9. Acceptance Criteria

| Criterion | Verification |
|---|---|
| `POST /api/orders/` creates Order + OrderItems + reserves inventory | `test_successful_order_creation_returns_201` |
| Overselling is rejected | `test_insufficient_stock_returns_400` |
| Inactive products are rejected | `test_inactive_product_returns_400` |
| Missing products are rejected | `test_missing_product_returns_400` |
| Client-supplied price is ignored | `test_backend_determines_price_not_client` |
| Price snapshot is independent of product price changes | `test_price_snapshot_behavior` |
| Invalid request structure returns 400 | `test_invalid_request_returns_400` |
| Duplicate products in one request returns 400 | `test_duplicate_products_returns_400` |
| All 18 tests pass against MySQL | `poetry run python manage.py test orders.tests` |
