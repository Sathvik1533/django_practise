# Django E-Commerce Logistics Engine

![Django Tests](https://github.com/Sathvik1533/ecommerce-logistics-platform/actions/workflows/django-tests.yml/badge.svg)

A backend API for order creation with safe inventory reservation,
built with Django 6.1, Django REST Framework, and MySQL.

This project follows Vertical Slice Architecture: each feature owns its
complete slice from HTTP routing to database, including tests.

## Project Status

| Stage | Description | Status |
|---|---|---|
| 0 | Project bootstrap | Done |
| 1 | Data models and migrations | Done |
| 2 | Input validation service | Done |
| 3 | Order creation transaction | Done |
| 4 | DRF serializer and API view | Done |
| 5 | CORS configuration | Done |
| 6 | React frontend | Not started |
| 7 | JWT authentication | Not started |
| 8 | Celery + Redis background tasks | Not started |
| 9 | Deployment | Not started |

## Requirements

- Python 3.13
- Poetry (dependency manager)
- MySQL 8+ with a database created
- Node.js 18+ (for frontend, Stage 6+)

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

```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=ecommerce_logistics
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Create the MySQL database

```sql
CREATE DATABASE ecommerce_logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Apply migrations

```bash
poetry run python manage.py migrate
```

### 5. Start the development server

```bash
poetry run python manage.py runserver
```

The API is now available at http://localhost:8000

## Commands Reference

### Development

```bash
# Start Django development server
poetry run python manage.py runserver

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
# Run all tests
poetry run python manage.py test orders.tests

# Run a specific test class
poetry run python manage.py test orders.tests.CreateOrderTests

# Run with verbose output (shows each test name)
poetry run python manage.py test orders.tests --verbosity=2

# Run keeping the test database (faster on re-run)
poetry run python manage.py test orders.tests --keepdb
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

### Health Check

```
GET /health/
Response: {"status": "ok"}
```

### Create Order

```
POST /api/orders/
Content-Type: application/json
```

Request body:
```json
{"items": [{"product_id": 1, "quantity": 2}]}
```

Success response (201 Created):
```json
{"order_id": 123, "status": "pending", "items": [{"product_id": 1, "quantity": 2, "unit_price": "1000.00", "line_total": "2000.00"}], "total": "2000.00", "created_at": "2024-01-20T15:30:00Z"}
```

Error responses (400 Bad Request):

Structure error: {"items": ["This field is required."]}
Business error: {"error": "Insufficient stock for product 1"}
Other errors: "Product 5 is inactive", "Product 99 has no inventory record"

## Project Structure

```
ecommerce-logistics-platform/
config/                  Django project configuration
  settings.py            All settings, reads from .env
  urls.py                Root URL routing
  views.py               Health check view
inventory/               Product catalogue and stock
  models.py              Product, Inventory
orders/                  Order creation feature (vertical slice)
  models.py              Order, OrderItem
  serializers.py         DRF input validation
  services.py            Business logic, transaction, row locking
  views.py               HTTP handling
  urls.py                Order-specific routes
  tests.py               All tests for this slice
docs/
  architecture.md         Architecture and design decisions
  learning.md             Plain-English learning journal
PRD.md                   Product requirements
stages.md                Implementation stages with gates
tasks.md                 Task list with status
.env.example             Required environment variables
pyproject.toml           Python dependencies (Poetry)
manage.py                Django CLI entry point
```

## Running Tests

Tests run against a real MySQL database (test_ecommerce_logistics).
Django creates and destroys this database automatically on each test run.

```bash
poetry run python manage.py test orders.tests
```

Expected output:
```
Creating test database for alias 'default' ('test_ecommerce_logistics')...
Ran 18 tests in 0.051s
OK
```

Test classes:
- ValidateOrderItemsTests (6 tests) — Pure Python validation, no database
- CreateOrderTests (4 tests) — Service layer with real MySQL transactions
- OrderCreateAPITests (8 tests) — Full HTTP to service to database flow

## Documentation

| File | Purpose |
|---|---|
| README.md | Setup, commands, API reference |
| PRD.md | Product requirements and acceptance criteria |
| stages.md | Implementation stages with entry/exit gates |
| tasks.md | Task list with status and verification commands |
| docs/architecture.md | Architecture, data flow, design decisions |
| docs/learning.md | Plain-English learning journal |

