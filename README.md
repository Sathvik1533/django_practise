# Django E-Commerce Logistics Platform

![Django Tests](https://github.com/Sathvik1533/ecommerce-logistics-platform/actions/workflows/django-tests.yml/badge.svg)

A hybrid asynchronous/synchronous backend platform for e-commerce order processing with flash-sale-grade inventory correctness, built with Django 6.1, Django REST Framework, Daphne ASGI server, Celery, Redis, and MySQL 8.4.

This project follows Vertical Slice Architecture: each feature owns its complete slice from HTTP routing to database, including tests.

## Architecture Overview

### Hybrid Async/Sync Design

- **ASGI Foundation**: Daphne 4.2.3 server for async HTTP handling
- **Synchronous Core**: Order creation uses `transaction.atomic()` + `select_for_update()` for inventory correctness in flash sale scenarios
- **Asynchronous Tasks**: Celery 5.6.3 + Redis 5.3.1 for background post-order workflows
- **Best-Effort Dispatch**: Background tasks dispatched via `transaction.on_commit()` - order succeeds even if Redis is unavailable

### Critical Correctness Properties

1. **Inventory Atomicity**: Synchronous transactions with row-level locking prevent overselling
2. **Order Availability**: Order creation succeeds regardless of task broker availability
3. **Task Dispatch Safety**: Tasks only dispatched after order transaction commits (prevents phantom fulfillment)

## Technology Stack

- **Framework**: Django 6.1.1
- **API**: Django REST Framework 3.18.3
- **Database**: MySQL 8.4+ with mysqlclient (synchronous driver)
- **ASGI Server**: Daphne 4.2.3
- **Task Queue**: Celery 5.6.3
- **Message Broker**: Redis 5.3.1
- **Testing**: Django TestCase + TransactionTestCase (37 tests)
- **CI/CD**: GitHub Actions with MySQL 8.4

## Project Status

| Milestone | Description | Status |
|---|---|---|
| 0 | Project bootstrap | ✅ Done |
| 1 | Data models and migrations | ✅ Done |
| 2 | ASGI Foundation (Daphne + async views) | ✅ Done |
| 3 | Celery + Redis background tasks | ✅ Done |
| 4 | Concurrency testing (flash sale simulation) | 🔄 Next |
| 5 | React frontend integration | ⏳ Not started |
| 6 | JWT authentication | ⏳ Not started |
| 7 | Production deployment | ⏳ Not started |

## Requirements

- Python 3.13
- Poetry (dependency manager)
- MySQL 8.4+ with a database created
- Redis 5.3+ (for background tasks)
- Node.js 18+ (for frontend, Milestone 5+)

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/Sathvik1533/ecommerce-logistics-platform.git
cd ecommerce-logistics-platform
poetry install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your MySQL credentials and a real SECRET_KEY
```

Required variables (see .env.example):

```bash
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=ecommerce_logistics
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
CORS_ALLOWED_ORIGINS=http://localhost:3000
CELERY_BROKER_URL=redis://localhost:6379/0
```

### 3. Create the MySQL database

```sql
CREATE DATABASE ecommerce_logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Apply migrations

```bash
poetry run python manage.py migrate
```

### 5. Install and start Redis

**macOS (Homebrew):**
```bash
brew install redis
redis-server
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Verify Redis:**
```bash
redis-cli ping  # Should respond: PONG
```

### 6. Start the system (3 terminals)

**Terminal 1: Redis**
```bash
redis-server
```

**Terminal 2: Celery Worker**
```bash
poetry run celery -A config worker --loglevel=info
```

**Terminal 3: Daphne ASGI Server**
```bash
poetry run daphne config.asgi:application -b 127.0.0.1 -p 8000
```

The API is now available at http://localhost:8000

## Commands Reference

### Development Servers

```bash
# Start Daphne ASGI server (async-capable)
poetry run daphne config.asgi:application -b 127.0.0.1 -p 8000

# Start Celery worker
poetry run celery -A config worker --loglevel=info

# Start Redis (required for background tasks)
redis-server
```

### Django Management

```bash
# Django system check
poetry run python manage.py check

# Show migration status
poetry run python manage.py showmigrations

# Apply all pending migrations
poetry run python manage.py migrate

# Generate new migrations after model changes
poetry run python manage.py makemigrations

# Open Django shell
poetry run python manage.py shell

# Create superuser for admin
poetry run python manage.py createsuperuser
```

### Testing

```bash
# Run all tests (37 tests: 27 orders/inventory + 10 task tests + 2 async health)
poetry run python manage.py test

# Run specific test suites
poetry run python manage.py test orders.tests        # Order creation tests
poetry run python manage.py test orders.test_tasks   # Celery task tests
poetry run python manage.py test config.tests        # Async health check tests

# Run with verbose output
poetry run python manage.py test --verbosity=2

# Run keeping the test database (faster on re-run)
poetry run python manage.py test --keepdb
```

### Celery Monitoring

```bash
# Check active tasks
poetry run celery -A config inspect active

# Check worker stats
poetry run celery -A config inspect stats

# Check registered tasks
poetry run celery -A config inspect registered

# Check Redis queue length
redis-cli llen celery
```

### Dependencies

```bash
# Add a new production dependency
poetry add <package-name>

# Add a development-only dependency
poetry add --group dev <package-name>

# Install all dependencies from lock file
poetry install

# Show installed packages
poetry show
```

## API Reference

### Health Check (Async)

```http
GET /health/
```

**Response (200 OK):**
```json
{"status": "ok"}
```

### Create Order (Sync with Async Task Dispatch)

```http
POST /api/orders/
Content-Type: application/json
```

**Request body:**
```json
{
  "items": [
    {"product_id": 1, "quantity": 2}
  ]
}
```

**Success response (201 Created):**
```json
{
  "order_id": 123,
  "status": "pending",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": "1000.00",
      "line_total": "2000.00"
    }
  ],
  "total": "2000.00",
  "created_at": "2024-10-24T15:30:00Z"
}
```

**After successful order creation:**
- Order transaction commits with reserved inventory
- `prepare_order_fulfillment` task dispatched to Celery (best-effort)
- Task logs fulfillment data for warehouse systems

**Error responses (400 Bad Request):**
```json
{"items": ["This field is required."]}
{"error": "Insufficient stock for product 1"}
{"error": "Product 5 is inactive"}
{"error": "Product 99 has no inventory record"}
```

## Background Tasks

### orders.tasks.prepare_order_fulfillment

**Purpose:** Asynchronous fulfillment preparation after order creation

**Trigger:** Automatically dispatched via `transaction.on_commit()` after order commits

**Configuration:**
- Max retries: 3
- Retry delay: 60 seconds

**Behavior:**
- Fetches order with related items
- Logs fulfillment data (consumed by warehouse systems)
- Retries on transient failures (network, external API)
- Does not retry if order doesn't exist

**Example Log Output:**
```json
{
  "order_id": 123,
  "status": "pending",
  "item_count": 2,
  "items": [
    {
      "sku": "LAPTOP-001",
      "name": "Laptop",
      "quantity": 1,
      "unit_price": "999.99"
    }
  ],
  "created_at": "2024-10-24T12:34:56Z"
}
```

See [docs/CELERY_WORKER.md](docs/CELERY_WORKER.md) for comprehensive task documentation.

## Project Structure

```
ecommerce-logistics-platform/
├── config/                  # Django project configuration
│   ├── settings.py          # Settings with Celery + Redis config
│   ├── celery.py            # Celery app initialization
│   ├── asgi.py              # ASGI application entry point
│   ├── urls.py              # Root URL routing
│   ├── views.py             # Async health check
│   └── tests.py             # Async view tests
├── inventory/               # Product catalogue and stock
│   ├── models.py            # Product, Inventory
│   └── tests.py             # Inventory tests
├── orders/                  # Order creation feature (vertical slice)
│   ├── models.py            # Order, OrderItem
│   ├── serializers.py       # DRF input validation
│   ├── services.py          # Sync transaction + async task dispatch
│   ├── tasks.py             # Celery background tasks
│   ├── views.py             # HTTP handling (DRF views)
│   ├── urls.py              # Order-specific routes
│   ├── tests.py             # Order creation tests
│   └── test_tasks.py        # Celery task tests (10 tests)
├── docs/
│   ├── ASGI_SERVER.md       # Daphne startup guide
│   ├── CELERY_WORKER.md     # Celery + Redis guide
│   ├── architecture.md      # Architecture decisions
│   ├── api-contract.md      # API specification
│   ├── database-schema.md   # MySQL schema documentation
│   ├── frontend-integration.md  # Frontend integration guide
│   └── learning.md          # Learning journal
├── .github/
│   └── workflows/
│       └── django-tests.yml # CI pipeline with MySQL 8.4
├── .env.example             # Required environment variables
├── pyproject.toml           # Python dependencies (Poetry)
├── poetry.lock              # Dependency lock file
├── manage.py                # Django CLI entry point
└── README.md                # This file
```

## Running Tests

Tests run against a real MySQL database (`test_ecommerce_logistics`). Django creates and destroys this database automatically on each test run.

```bash
poetry run python manage.py test
```

**Expected output:**
```
Found 37 test(s).
Creating test database for alias 'default' ('test_ecommerce_logistics')...
.....................................
----------------------------------------------------------------------
Ran 37 tests in 0.134s
OK
Destroying test database for alias 'default'...
```

### Test Coverage

| Test Suite | Count | Purpose |
|---|---|---|
| orders.tests.ValidateOrderItemsTests | 6 | Pure Python validation |
| orders.tests.CreateOrderTests | 4 | Service layer transactions |
| orders.tests.OrderCreateAPITests | 8 | Full HTTP integration |
| inventory.tests | 9 | Inventory model tests |
| orders.test_tasks.TaskRegistrationTest | 2 | Celery task discovery |
| orders.test_tasks.PrepareOrderFulfillmentTest | 3 | Task execution logic |
| orders.test_tasks.DispatchOrderFulfillmentTest | 2 | Task dispatch handling |
| orders.test_tasks.TransactionCommitDispatchTest | 3 | Dispatch timing correctness |
| config.tests.AsyncHealthCheckTest | 2 | Async view tests |

## Documentation

| File | Purpose |
|---|---|
| [README.md](README.md) | Setup, commands, API reference |
| [docs/ASGI_SERVER.md](docs/ASGI_SERVER.md) | Daphne ASGI server guide |
| [docs/CELERY_WORKER.md](docs/CELERY_WORKER.md) | Celery + Redis setup, tasks, failure scenarios |
| [docs/architecture.md](docs/architecture.md) | Architecture decisions |
| [docs/api-contract.md](docs/api-contract.md) | API specification for frontend |
| [docs/database-schema.md](docs/database-schema.md) | MySQL schema documentation |
| [docs/frontend-integration.md](docs/frontend-integration.md) | Frontend integration guide |

## Contributing

This project is currently in active development. The main branch contains stable releases. Development happens on feature branches:

- `feature/async-asgi-foundation` — Async architecture implementation (current)
- `feature/frontend-dashboard` — React frontend (Antigravity's work)

## License

[Add your license here]
