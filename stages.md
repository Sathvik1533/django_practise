# Stages — Django E-Commerce Logistics Engine

Each stage has entry criteria, deliverables, and exit criteria.
A stage is DONE only when exit criteria are verified with actual commands and output.

---

## Stage 0 — Project Bootstrap
**WHAT:** Initialize repo, Poetry, Django project, database.
**Status:** DONE

Deliverables: Django 6.1, pyproject.toml, MySQL via dj_db_conn_pool, python-dotenv,
GET /health/, all migrations applied.

Exit verification:
    poetry run python manage.py check         # 0 issues
    poetry run python manage.py showmigrations # all [X]
    curl http://localhost:8000/health/

Evidence: System check passes. All migrations [X]. Health view present.

---

## Stage 1 — Data Models and Migrations
**WHAT:** Define Product, Inventory, Order, OrderItem with DB-level constraints.
**Status:** DONE

Deliverables:
- inventory/models.py: Product, Inventory (check constraint reserved_lte_on_hand)
- orders/models.py: Order (status choices), OrderItem (quantity > 0, unit_price >= 0)
- inventory/migrations/0001_initial.py
- orders/migrations/0001_initial.py

Key decisions:
- available_quantity is a Python property (on_hand - reserved), not a column.
- OrderItem.unit_price is a stored snapshot, not a reference to Product.price.
- OneToOneField(on_delete=PROTECT) for Inventory to Product.
- ForeignKey(on_delete=PROTECT) prevents accidental product deletion.

Exit verification:
    poetry run python manage.py showmigrations inventory orders

Evidence: Both migrations applied and verified.

---

## Stage 2 — Service Layer: Input Validation
**WHAT:** validate_order_items() — pure Python, no database.
**Status:** DONE

Deliverables:
- validate_order_items(items) in orders/services.py
- OrderCreationError exception class
- 6 unit tests in ValidateOrderItemsTests (SimpleTestCase)

Rules: non-empty list, exact keys only (no unit_price from client),
positive integers, no duplicate product_id.

Exit verification:
    poetry run python manage.py test orders.tests.ValidateOrderItemsTests --verbosity=2

Evidence: 6 tests pass.

---

## Stage 3 — Service Layer: Order Creation Transaction
**WHAT:** create_order() — lock rows, validate business rules, create
Order + OrderItems, reserve stock, return Order object.
**Status:** DONE

Deliverables:
- create_order(items) in orders/services.py
- select_for_update() ordered by product_id (prevents deadlocks)
- Rejects: inactive product, insufficient stock, missing inventory record
- Order(status=PENDING), OrderItem with unit_price snapshot, quantity_reserved incremented
- Entire operation inside transaction.atomic()
- 4 database tests in CreateOrderTests (TestCase, MySQL)

Exit verification:
    poetry run python manage.py test orders.tests.CreateOrderTests --verbosity=2
    # MySQL confirmed: output shows test_ecommerce_logistics

Evidence: 4 tests pass against MySQL test_ecommerce_logistics.

Known limitation: Concurrency not stress-tested. Single-threaded tests cannot
simulate two simultaneous transactions.

---

## Stage 4 — DRF Serializer and API View
**WHAT:** Wire HTTP to service. Serializer validates, view calls create_order(),
returns HTTP 201 with order details.
**Status:** DONE

Deliverables:
- OrderItemInputSerializer, OrderCreateSerializer in orders/serializers.py
- OrderCreateView in orders/views.py
- POST /api/orders/ in orders/urls.py and config/urls.py
- Serializer errors to 400. OrderCreationError to 400 {"error":"..."}.
  Unexpected exceptions to 500 (not caught by view).
- 8 API integration tests in OrderCreateAPITests (TestCase)

Exit verification:
    poetry run python manage.py test orders.tests --verbosity=0
    # Expected: Ran 18 tests, OK

Evidence: All 18 tests pass.

---

## Stage 5 — CORS Configuration
**WHAT:** Allow React (localhost:3000) to call Django (localhost:8000).
**Status:** DONE

Deliverables:
- django-cors-headers installed
- CorsMiddleware in MIDDLEWARE above CommonMiddleware
- CORS_ALLOWED_ORIGINS from environment variable
- .env.example with all required variables
- SECRET_KEY, DEBUG, ALLOWED_HOSTS all from environment

Exit verification:
    poetry run python manage.py check
    poetry run python manage.py test orders.tests --verbosity=0

Evidence: Check passes, 18 tests still pass.

---

## Stage 6 — React Frontend
**WHAT:** Minimal React UI: product/quantity inputs, submit, show result.
**Status:** NOT STARTED

Entry criteria: Stage 5 complete. (Met)

Deliverables:
- Vite + React app in frontend/
- OrderForm component with product_id and quantity inputs
- fetch() to POST /api/orders/ with JSON body
- Loading, success, and error states rendered
- CORS verified end-to-end in a real browser

Exit verification:
    cd frontend && npm run dev
    # Submit valid order in browser - 201 response rendered
    # Submit invalid data - 400 error rendered

---

## Stage 7 — JWT Authentication
**WHAT:** Authenticated order creation. Users see only their own orders.
**Status:** NOT STARTED — blocked on Stage 6

Unresolved:
- Order model needs user ForeignKey and new migration.
- Unauthenticated request: 401 or 403?
- Token storage in React: memory vs localStorage vs httpOnly cookie?

Planned deliverables:
- Order.user ForeignKey to AUTH_USER_MODEL
- POST /api/auth/token/ returns access + refresh tokens
- OrderCreateView requires valid JWT
- Migration for orders_order.user_id column

---

## Stage 8 — Celery + Redis Background Tasks
**WHAT:** Dispatch confirmation email after successful order commit.
**Status:** NOT STARTED — blocked on Stage 7

Critical rule: task dispatch MUST use transaction.on_commit():

    # Correct - fires only after database commits
    transaction.on_commit(lambda: send_order_confirmation.delay(order.id))

    # Wrong - fires inside the transaction before commit
    send_order_confirmation.delay(order.id)

Unresolved: email content, idempotency key, retry policy.

---

## Stage 9 — Deployment
**WHAT:** Production service with Gunicorn, Nginx, environment config.
**Status:** NOT STARTED — blocked on Stage 8

Unresolved: Docker vs bare-metal, cloud provider, migration release strategy.
