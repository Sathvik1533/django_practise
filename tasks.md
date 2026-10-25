# Tasks — Django E-Commerce Logistics Engine

Status: TODO | IN_PROGRESS | DONE | BLOCKED. A task is DONE only when the verification command confirms it.

---

## Stage 0-5 — DONE (Stages 0 through 5 are fully implemented and verified)

| # | Task | Status | Evidence |
|---|---|---|---|
| 0-1 | Initialize Django 6.1 with Poetry | DONE | manage.py check 0 issues |
| 0-2 | Configure MySQL with connection pool | DONE | showmigrations all [X] |
| 0-3 | Add python-dotenv and load .env | DONE | Settings read DB vars from env |
| 0-4 | Create GET /health/ endpoint | DONE | Returns status ok |
| 0-5 | Apply all initial migrations | DONE | showmigrations all [X] |
| 1-1 | Product model name sku price is_active | DONE | Migration 0001 applied |
| 1-2 | Inventory model + check reserved_lte_on_hand | DONE | Migration 0001 applied |
| 1-3 | Order model with status choices | DONE | Migration 0001 applied |
| 1-4 | OrderItem with stored unit_price snapshot | DONE | Migration 0001 applied |
| 1-5 | DB check constraints on OrderItem | DONE | Migration 0001 applied |
| 2-1 | validate_order_items() | DONE | 6 tests pass |
| 2-2 | Reject empty items list | DONE | test_rejects_empty_items |
| 2-3 | Reject zero or negative quantity | DONE | test_rejects_zero_quantity |
| 2-4 | Reject invalid product_id | DONE | test_rejects_invalid_product_id |
| 2-5 | Reject duplicate product_ids | DONE | test_rejects_duplicate_products |
| 2-6 | Reject client-supplied unit_price | DONE | test_rejects_client_supplied_price |
| 3-1 | create_order() with transaction.atomic() | DONE | 4 DB tests pass |
| 3-2 | select_for_update() row locking | DONE | test_successful_order_creation |
| 3-3 | Locks ordered by product_id (no deadlocks) | DONE | Code review |
| 3-4 | Reject inactive products | DONE | test_inactive_product_raises_error |
| 3-5 | Reject insufficient stock | DONE | test_insufficient_stock_raises_error |
| 3-6 | Create Order(status=PENDING) | DONE | test_successful_order_creation |
| 3-7 | Create OrderItem with unit_price snapshot | DONE | test_price_snapshot_behavior |
| 3-8 | Reserve inventory quantity_reserved += qty | DONE | test_successful_order_creation |
| 3-9 | Rollback leaves no partial order | DONE | test_insufficient_stock checks count==0 |
| 4-1 | OrderItemInputSerializer | DONE | 8 API tests pass |
| 4-2 | OrderCreateSerializer with validate_items | DONE | 8 API tests pass |
| 4-3 | Fix unreachable return in validate_items | DONE | Code review |
| 4-4 | OrderCreateView calls create_order() | DONE | test_successful_order_creation_returns_201 |
| 4-5 | Return HTTP 201 with full order details | DONE | test_successful_order_creation_returns_201 |
| 4-6 | Catch OrderCreationError return 400 | DONE | test_insufficient_stock_returns_400 |
| 4-7 | Unexpected exceptions propagate as 500 | DONE | No bare except in views.py |
| 4-8 | unit_price from backend not client | DONE | test_backend_determines_price_not_client |
| 4-9 | Wire POST /api/orders/ URL | DONE | All 8 API tests reach view |
| 4-10 | Fix manage.py syntax error | DONE | manage.py check passes |
| 4-11 | Fix config/views.py orphaned @ | DONE | manage.py check passes |
| 5-1 | Install django-cors-headers | DONE | In pyproject.toml |
| 5-2 | CorsMiddleware above CommonMiddleware | DONE | settings.py |
| 5-3 | CORS_ALLOWED_ORIGINS from environment | DONE | settings.py |
| 5-4 | Create .env.example | DONE | File at repo root |
| 5-5 | SECRET_KEY DEBUG ALLOWED_HOSTS from env | DONE | settings.py |
---

## Stage 6 — React Frontend

| # | Task | Status | Verification |
|---|---|---|---|
| 6-1 | Scaffold Vite React app | TODO | npm start works |
| 6-2 | OrderForm component | TODO | Renders in browser |
| 6-3 | fetch to POST /api/orders/ | TODO | Network tab shows request |
| 6-4 | Loading state | TODO | Spinner on submit |
| 6-5 | Success state with order details | TODO | Order ID total rendered |
| 6-6 | Error state with message | TODO | Error rendered on 400 |
| 6-7 | CORS verified in browser | TODO | No CORS errors in console |

---

## Stage 7 — JWT Authentication

| # | Task | Status | Verification |
|---|---|---|---|
| 7-1 | Choose JWT library | TODO | Decision in ADR |
| 7-2 | Order.user ForeignKey + migration | TODO | New migration applied |
| 7-3 | POST /api/auth/token/ | TODO | Returns access + refresh |
| 7-4 | Protect OrderCreateView | TODO | 401 without token |
| 7-5 | Filter orders by user | TODO | Users see only own orders |
| 7-6 | React stores and sends JWT | TODO | Authorization header sent |

---

## Stage 8 — Celery + Redis

| # | Task | Status | Verification |
|---|---|---|---|
| 8-1 | Install celery + redis | BLOCKED | Wait Stage 7 |
| 8-2 | Configure Celery with Redis broker | BLOCKED | Wait Stage 7 |
| 8-3 | send_order_confirmation task | BLOCKED | Wait Stage 7 |
| 8-4 | Dispatch via transaction.on_commit | BLOCKED | Wait Stage 7 |
| 8-5 | Retry policy and idempotency key | BLOCKED | Wait Stage 7 |

---

## Stage 9 — Deployment

| # | Task | Status | Verification |
|---|---|---|---|
| 9-1 | Gunicorn in dependencies | BLOCKED | Wait Stage 8 |
| 9-2 | Nginx configuration | BLOCKED | Wait Stage 8 |
| 9-3 | Deployment runbook | BLOCKED | Wait Stage 8 |
| 9-4 | Migration release strategy | BLOCKED | Wait Stage 8 |

---

## Outstanding Issues

| Issue | Impact | Resolution |
|---|---|---|
| test_views.py broken test | Low | Replace in Stage 6 |
| Concurrency not stress-tested | Medium | Threading test planned |
| SECRET_KEY insecure fallback | High in prod | Remove before deploy |
| No order list or detail endpoint | Medium | Required for Stage 6 |
| learning.md needs rewrite | Low | Restore content |
