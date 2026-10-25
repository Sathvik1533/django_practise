# Engineering Decision Book

**Project**: E-commerce Logistics Management Platform  
**Repository**: https://github.com/Sathvik1533/ecommerce-logistics-platform  
**Branch**: `feature/async-asgi-foundation`  
**Last Updated**: October 2026  
**Status**: Milestone 4 Complete, Milestone 5 In Progress

## Table of Contents

1. [Problem and System Overview](#chapter-1-problem-and-system-overview)
2. [Technology Choices](#chapter-2-technology-choices)
3. [Synchronous vs Asynchronous Execution](#chapter-3-synchronous-vs-asynchronous-execution)
4. [Order and Inventory Correctness](#chapter-4-order-and-inventory-correctness)
5. [Celery and Redis](#chapter-5-celery-and-redis)
6. [API and Frontend Integration](#chapter-6-api-and-frontend-integration)
7. [Testing, CI, and Deployment](#chapter-7-testing-ci-and-deployment)
8. [Engineering Decisions and Trade-offs](#chapter-8-engineering-decisions-and-trade-offs)
9. [STAR-format Project-defense Examples](#chapter-9-star-format-project-defense-examples)
10. [Known Limitations and Future Work](#chapter-10-known-limitations-and-future-work)

---

## Chapter 1: Problem and System Overview

### Business Problem
E-commerce platform experiencing flash sales with concurrent demand spikes. Need to prevent overselling while maintaining order throughput.

### Core Requirements
- Prevent inventory overselling under concurrent load
- Maintain transaction correctness
- Support background fulfillment processing
- Enable async HTTP handling for concurrent connections

### Architecture Diagram
```
┌─────────────────┐     HTTP     ┌─────────────────┐
│   React Frontend│──────────────►│  Daphne ASGI    │
│   (Vercel)      │◄─────────────┤  Server         │
└─────────────────┘     CORS     └────────┬────────┘
                                          │
                                          │ Database
                            ┌─────────────┼─────────────┐
                            ▼             ▼             ▼
                    ┌─────────────┐ ┌──────────┐ ┌────────────┐
                    │   MySQL 8.4 │ │  Redis   │ │  Celery    │
                    │   Database  │ │  Broker  │ │  Worker    │
                    └─────────────┘ └──────────┘ └────────────┘
```

### What the System Currently Does
- ✅ Order creation with inventory validation
- ✅ Concurrent flash sale protection
- ✅ Background fulfillment task dispatch
- ✅ Async HTTP handling (Daphne)
- ✅ 48 passing tests (unit, integration, concurrency)
- ✅ CI pipeline with MySQL 8.4

### What the System Does NOT Do
- ❌ Customer authentication (planned)
- ❌ Payment processing (planned)
- ❌ Frontend integration (separate branch)
- ❌ Production deployment (not yet deployed)

---

## Chapter 2: Technology Choices

| Technology | Purpose | Alternatives Considered | Decision Reason |
|------------|---------|------------------------|-----------------|
| Python 3.13 | Backend language | Node.js, Go | Rapid development, strong Django ecosystem |
| Django 6.1 | Web framework | Flask, FastAPI | Built-in ORM, transactions, testing |
| MySQL 8.4 | Database | PostgreSQL, NoSQL | InnoDB row-level locking for inventory |
| Daphne | ASGI server | Uvicorn, Hypercorn | Django-native, Gopal's requirement |
| Celery | Task queue | RQ, Django-Q | Industry standard, retry mechanisms |
| Redis | Message broker | RabbitMQ, Database queue | Fast, simple, in-memory |
| React | Frontend | Vue, Angular | Component-based, TypeScript integration |
| GitHub Actions | CI/CD | CircleCI, Jenkins | Integrated with GitHub, free for public repos |

---

## Chapter 3: Synchronous vs Asynchronous Execution

### Critical Decision: Hybrid Architecture

**Async Components**:
- Daphne ASGI server (HTTP connection handling)
- Celery worker (background task execution)
- Health check view (async def, no database)

**Sync Components**:
- Order creation service (requires select_for_update())
- Database operations (mysqlclient driver)
- DRF views (order creation, product listing)

### Why Order Creation Remains Synchronous
1. **select_for_update() requirement**: Only available in Django's synchronous ORM
2. **Transaction duration**: ~50ms (acceptable blocking time)
3. **Async driver limitation**: aiomysql doesn't support select_for_update() in Django async ORM
4. **Correctness over performance**: Inventory correctness cannot be compromised

### transaction.on_commit() Usage
```python
with transaction.atomic():
    order = create_order(items)
    transaction.on_commit(
        lambda: dispatch_order_fulfillment(order.id)
    )
```
**Guarantees**: Task only dispatched after order commits  
**Limitation**: No guarantee task reaches Redis (best-effort)

### Best-Effort Dispatch Trade-off
**Problem**: Should order fail if Redis is down?  
**Decision**: Order succeeds, task dispatch is best-effort  
**Rationale**: Order correctness is critical, tasks can be retried  
**Evidence**: `test_order_succeeds_despite_redis_failure` passes

---

## Chapter 4: Order and Inventory Correctness

### Data Models
- **Product**: SKU, name, price, is_active
- **Inventory**: product (FK), quantity_on_hand, quantity_reserved
- **Order**: status, created_at
- **OrderItem**: order (FK), product (FK), quantity, unit_price (snapshot)

### Critical Invariants
1. `available_quantity ≥ 0` (no negative inventory)
2. `quantity_reserved ≤ quantity_on_hand` (can't reserve more than exists)
3. Failed orders leave no partial state (transaction rollback)

### Flash Sale Concurrency Test Results
**Setup**: 10 units available, 50 concurrent requests  
**Result**: 10 orders succeed, 10 units reserved, 0 overselling  
**Connection pool**: 31/50 requests hit pool exhaustion (expected)  
**Verification**: `test_flash_sale_prevents_overselling` passes

### Why Row Locking ≠ FIFO
`select_for_update()` guarantees no overselling but doesn't guarantee which requests succeed first. Database lock acquisition order depends on MySQL scheduler, not request arrival time.

---

## Chapter 5: Celery and Redis

### Task: prepare_order_fulfillment
```python
@shared_task(max_retries=3, default_retry_delay=60)
def prepare_order_fulfillment(order_id):
    # Fetches order, logs fulfillment data
    # Structured logs for warehouse consumption
    # No external integrations (no fake emails)
```

### Dispatch Flow
1. Order transaction commits
2. `transaction.on_commit()` fires
3. `prepare_order_fulfillment.apply_async()` called
4. Task sent to Redis (or fails gracefully)
5. Celery worker picks up task when Redis available

### Redis Unavailability Handling
- Order succeeds regardless of Redis status
- Task dispatch failure logged
- Monitoring required to detect and recover

### Commit-to-Dispatch Gap
**Problem**: Between transaction commit and task dispatch, process could crash  
**Current**: Best-effort (task lost)  
**Alternative**: Transactional outbox (stores tasks in database, separate delivery process)  
**Decision**: Best-effort for simplicity, monitor for issues

---

## Chapter 6: API and Frontend Integration

### API Contracts

#### GET /health/
```json
{"status": "ok"}
```
**Async view**, no database access

#### GET /api/products/
```json
[
  {
    "id": 1,
    "sku": "LAPTOP-001",
    "name": "Laptop Pro",
    "price": "1299.99",
    "available_quantity": 5
  }
]
```
**Active products only**, available_quantity = on_hand - reserved

#### POST /api/orders/
**Request**:
```json
{
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 3, "quantity": 1}
  ]
}
```

**Success (201)**:
```json
{
  "order_id": 42,
  "status": "pending",
  "items": [...],
  "total": "3399.97"
}
```

**Error (400)**:
```json
{"error": "Insufficient stock for product 1"}
```

### Frontend Status
- **Branch**: `feature/frontend-dashboard` (separate)
- **Verified**: API contracts, CORS configured for localhost:3000
- **Not verified**: Actual React implementation, end-to-end workflow

---

## Chapter 7: Testing, CI, and Deployment

### Test Architecture (48 tests)
- **Unit**: 27 tests (business logic, no database)
- **Integration**: 13 tests (database, HTTP, tasks)
- **Concurrency**: 3 tests (real MySQL, threading)
- **Documentation**: 2 tests (decision capture)

### CI Pipeline (.github/workflows/django-tests.yml)
- **MySQL 8.4** (production equivalent)
- **Poetry** dependency management
- **48 tests** must pass
- **Status**: ✅ All passing

### Deployment Guide
**Local**: MySQL + Redis + Daphne + Celery (4 terminals)  
**Production**: Vercel (frontend) + EC2/RDS/ElastiCache (backend)  
**Limitations**: No HA Redis, no database replicas, no monitoring yet

---

## Chapter 8: Engineering Decisions and Trade-offs

### Decision 1: Hybrid Sync/Async Architecture
**Problem**: Async requirement vs. transaction correctness  
**Decision**: Async HTTP (Daphne), sync transactions (select_for_update)  
**Evidence**: Concurrency tests verify no overselling  
**Trade-off**: ASGI workers blocked during transactions (~50ms)

### Decision 2: MySQL 8.4 with Synchronous Driver
**Problem**: Async database operations vs. row-level locking  
**Decision**: Synchronous mysqlclient with select_for_update()  
**Evidence**: Flash sale test prevents overselling  
**Trade-off**: Can't use async driver, blocks during queries

### Decision 3: Best-Effort Task Dispatch
**Problem**: Task loss vs. order availability  
**Decision**: Order succeeds, tasks best-effort  
**Evidence**: Order created despite Redis failure  
**Trade-off**: Tasks can be lost, requires monitoring

### Decision 4: transaction.on_commit() Instead of Outbox
**Problem**: Guarantee task dispatch  
**Decision**: on_commit() (simpler) over transactional outbox (complex)  
**Evidence**: Tests verify no phantom tasks on rollback  
**Trade-off**: No delivery guarantee if process crashes

---

## Chapter 9: STAR-format Project-defense Examples

### Example: Preventing Flash Sale Overselling
**S**: Flash sale, 100 requests, 10 units available  
**T**: Ensure no more than 10 orders succeed  
**A**: Implemented select_for_update(), concurrency tests with 50 threads  
**R**: 10 orders succeeded, 0 overselling, tests pass

### Example: Handling Redis Failure
**S**: Redis broker down during order creation  
**T**: Keep orders processing without data loss  
**A**: Best-effort dispatch, try/except, monitoring  
**R**: Orders succeed, tasks logged for manual recovery

### Example: Hybrid Async/Sync Architecture
**S**: Team async requirement, inventory correctness requirement  
**T**: Design system satisfying both  
**A**: Async HTTP (Daphne), sync transactions, clear separation  
**R**: Correctness verified, async capability demonstrated

---

## Chapter 10: Known Limitations and Future Work

### Implemented and Tested
✅ Order creation and inventory validation  
✅ Flash sale concurrency protection  
✅ Background task dispatch  
✅ 48 passing tests  
✅ CI pipeline

### Tested But Not Production Verified
⚠️ Daphne under production load  
⚠️ Redis persistence and HA  
⚠️ Connection pool scaling

### Planned
🔄 Customer authentication (JWT)  
🔄 Order status workflow  
🔄 Payment integration  
🔄 Frontend deployment (Vercel)  
🔄 Production monitoring

### Out of Scope
❌ Warehouse system integration  
❌ Email notifications  
❌ Analytics and reporting
