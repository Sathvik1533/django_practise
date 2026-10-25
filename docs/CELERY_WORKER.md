# Celery Worker Guide

## Overview

The E-commerce Logistics Platform uses Celery 5.6.3 with Redis 5.3.1 for asynchronous background task processing. Background tasks handle post-order workflows like fulfillment preparation, which run outside the critical order transaction path.

## Architecture

### Task Dispatch Flow

```
1. HTTP Request (Create Order)
   ↓
2. Synchronous Transaction (transaction.atomic())
   - Validate products
   - Lock inventory (select_for_update)
   - Create order
   - Reserve inventory
   ↓
3. Transaction Commits
   ↓
4. transaction.on_commit() Fires
   ↓
5. Task Dispatched to Redis (best-effort)
   ↓
6. Celery Worker Executes Task (asynchronous)
```

### Critical Correctness Property

**Order creation succeeds even if Redis is unavailable.** Task dispatch is best-effort and logged, but does not block the synchronous order transaction. This ensures high availability for core order processing.

## Prerequisites

### Install Redis

**macOS (Homebrew):**
```bash
brew install redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
```

**Linux (RHEL/CentOS):**
```bash
sudo yum install redis
```

**Verify Installation:**
```bash
redis-cli --version
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Redis Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
```

### Settings

Celery configuration in `config/settings.py`:

- `CELERY_BROKER_URL`: Redis connection URL
- `CELERY_RESULT_BACKEND`: Task result storage (Redis)
- `CELERY_ACCEPT_CONTENT`: Allowed content types (JSON)
- `CELERY_TASK_SERIALIZER`: Task serialization format (JSON)
- `CELERY_RESULT_SERIALIZER`: Result serialization format (JSON)
- `CELERY_TIMEZONE`: Task scheduling timezone (UTC)
- `CELERY_TASK_TRACK_STARTED`: Track task started events
- `CELERY_TASK_TIME_LIMIT`: Maximum task execution time (300 seconds)

## Running the System

### Terminal 1: Start Redis

```bash
redis-server
```

**Expected Output:**
```
* Ready to accept connections tcp
```

**Verify Redis is Running:**
```bash
redis-cli ping
# Should respond: PONG
```

### Terminal 2: Start Celery Worker

```bash
cd /path/to/ecommerce-logistics-platform
poetry run celery -A config worker --loglevel=info
```

**Expected Output:**
```
 -------------- celery@hostname v5.6.3
---- **** ----- 
--- * ***  * -- Darwin-...
-- * - **** --- 
- ** ---------- [config]
- ** ---------- .> app:         ecommerce_logistics:0x...
- ** ---------- .> transport:   redis://localhost:6379/0
- ** ---------- .> results:     redis://localhost:6379/0
- *** --- * --- .> concurrency: 8 (prefork)
-- ******* ---- .> task events: OFF

[tasks]
  . config.celery.debug_task
  . orders.tasks.prepare_order_fulfillment

[2024-10-24 ...] INFO/MainProcess] Connected to redis://localhost:6379/0
[2024-10-24 ...] INFO/MainProcess] celery@hostname ready.
```

### Terminal 3: Start Django ASGI Server (Daphne)

```bash
cd /path/to/ecommerce-logistics-platform
poetry run daphne config.asgi:application -b 127.0.0.1 -p 8000
```

## Available Tasks

### orders.tasks.prepare_order_fulfillment

**Purpose:** Prepare order for fulfillment after successful creation

**Dispatched:** Automatically after order transaction commits

**Configuration:**
- Max retries: 3
- Retry delay: 60 seconds

**Behavior:**
- Fetches order with related items
- Logs fulfillment data for warehouse systems
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

## Failure Scenarios

### Scenario 1: Redis Unavailable at Task Dispatch

**Symptom:** Order created successfully, but task not dispatched

**Behavior:**
1. Order transaction commits normally
2. `transaction.on_commit()` fires
3. `dispatch_order_fulfillment()` catches exception
4. Error logged: "Failed to dispatch fulfillment task for Order #X"
5. HTTP response returns successfully with created order

**Impact:** Order is valid, but fulfillment preparation doesn't run

**Resolution:** 
- Monitor logs for dispatch failures
- Restart Redis
- Manually trigger fulfillment for affected orders if needed

### Scenario 2: Redis Unavailable During Task Execution

**Symptom:** Task dispatched but worker can't connect to broker

**Behavior:**
1. Celery worker logs connection errors
2. Worker retries connection with exponential backoff
3. Tasks remain queued in Redis (when it recovers)
4. Worker processes queued tasks after Redis is available

**Impact:** Delayed task execution

**Resolution:**
- Restart Redis
- Worker will reconnect automatically

### Scenario 3: Task Execution Failure

**Symptom:** Task runs but encounters error (e.g., database unavailable)

**Behavior:**
1. Task logs warning with traceback
2. Task retries up to 3 times (60-second delay)
3. After max retries, task fails permanently
4. Failure logged but doesn't affect order

**Impact:** Fulfillment preparation incomplete

**Resolution:**
- Check worker logs for specific error
- Fix underlying issue
- Manually retry task if needed

## Monitoring

### Check Task Queue

```bash
redis-cli llen celery
```

### View Task Results

```bash
redis-cli keys celery-task-meta-*
redis-cli get celery-task-meta-<task-id>
```

### Monitor Worker Health

```bash
poetry run celery -A config inspect active
poetry run celery -A config inspect stats
```

### View Worker Logs

Worker logs show:
- Task dispatch events
- Task execution start/completion
- Task failures and retries
- Connection issues

## Development vs Production

### Development (Current)

- Redis: localhost:6379
- Worker: Single process, loglevel=info
- No authentication

### Production (Future)

- Redis: Managed service (AWS ElastiCache, Azure Cache for Redis)
- Worker: Multiple processes, autoscaling
- Authentication: Redis password/TLS
- Monitoring: Prometheus, Grafana
- Dead letter queue: For permanently failed tasks

## Testing

### Run Task Tests

```bash
poetry run python manage.py test orders.test_tasks
```

Tests verify:
- Task registration and discovery
- Task execution logic
- Dispatch timing (only after transaction commits)
- Error handling and retry behavior
- Redis unavailability doesn't crash order creation

### Manual Task Testing

```python
# Django shell
poetry run python manage.py shell

from orders.tasks import prepare_order_fulfillment

# Execute task synchronously (for testing)
result = prepare_order_fulfillment(order_id=1)
print(result)

# Dispatch task to worker
prepare_order_fulfillment.apply_async(args=[1])
```

## Troubleshooting

### Worker Won't Start

**Check Redis connection:**
```bash
redis-cli ping
```

**Check port availability:**
```bash
lsof -i :6379
```

**Check Celery configuration:**
```bash
poetry run celery -A config inspect conf
```

### Tasks Not Executing

**Check worker is running:**
```bash
poetry run celery -A config inspect active_queues
```

**Check task is registered:**
```bash
poetry run celery -A config inspect registered
```

**Check Redis queue:**
```bash
redis-cli llen celery
```

### Task Failures

**View worker logs for traceback**

**Check task retry count:**
```python
from orders.tasks import prepare_order_fulfillment
print(prepare_order_fulfillment.max_retries)  # Should be 3
```

## References

- [Celery Documentation](https://docs.celeryq.dev/)
- [Redis Documentation](https://redis.io/docs/)
- [Django transaction.on_commit()](https://docs.djangoproject.com/en/6.1/topics/db/transactions/#django.db.transaction.on_commit)
