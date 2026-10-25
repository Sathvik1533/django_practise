# Deployment Guide

## Overview

This document covers deployment scenarios for the E-commerce Logistics Platform:
- **Local Development**: Single machine with all services
- **CI Verification**: GitHub Actions with MySQL 8.4
- **Production Deployment**: Distributed services on cloud infrastructure

## Local Development Stack (All on One Machine)

### Prerequisites

- Python 3.13
- Poetry
- MySQL 8.4
- Redis 5.3+
- macOS, Linux, or Windows Subsystem for Linux (WSL)

### Step 1: Clone and Install

```bash
git clone https://github.com/Sathvik1533/ecommerce-logistics-platform.git
cd ecommerce-logistics-platform
poetry install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with:
SECRET_KEY=generate-a-long-random-string-for-production
DEBUG=True
DB_NAME=ecommerce_logistics
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
CORS_ALLOWED_ORIGINS=http://localhost:3000
CELERY_BROKER_URL=redis://localhost:6379/0
```

### Step 3: Create MySQL Database

```bash
mysql -u root -p -e "CREATE DATABASE ecommerce_logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 4: Run Migrations

```bash
poetry run python manage.py migrate
```

### Step 5: Start All Services (5 Terminal Windows)

**Terminal 1: MySQL**
```bash
# Already running as system service or start if needed
mysql.server start
```

**Terminal 2: Redis**
```bash
redis-server
# Expected: [3306] 24 Oct 2026 12:00:00.000 * Ready to accept connections
```

**Terminal 3: Celery Worker**
```bash
poetry run celery -A config worker --loglevel=info
# Expected: [tasks]
#   . config.celery.debug_task
#   . orders.tasks.prepare_order_fulfillment
# [INFO/MainProcess] Connected to redis://localhost:6379/0
```

**Terminal 4: Daphne ASGI Server**
```bash
poetry run daphne config.asgi:application -b 127.0.0.1 -p 8000
# Expected: Starting server process [pid ...] 
# Listening on TCP address 127.0.0.1:8000
```

**Terminal 5: (Optional) Django Shell or Testing**
```bash
poetry run python manage.py shell
# Or run tests:
poetry run python manage.py test
```

### Step 6: Verify APIs

```bash
# Health check
curl http://localhost:8000/health/
# Expected: {"status":"ok"}

# List products
curl http://localhost:8000/api/products/
# Expected: [{"id":1,"sku":"...","name":"...","price":"...","available_quantity":...}, ...]

# Create order
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":1,"quantity":1}]}'
# Expected: {"order_id":1,"status":"pending",...}
```

## CI/CD Verification (GitHub Actions)

The project includes a GitHub Actions workflow at `.github/workflows/django-tests.yml`.

### Workflow Configuration

- **Trigger**: Push to `main` or pull request to `main`
- **Runner**: Ubuntu Latest
- **Services**: MySQL 8.4 (container), Python 3.13
- **Steps**:
  1. Checkout code
  2. Install Python 3.13
  3. Install Poetry
  4. Cache dependencies
  5. Wait for MySQL to be ready
  6. Run Django system checks
  7. Apply migrations
  8. Run full test suite (48 tests)

### Running CI Locally

To test CI locally before pushing:

```bash
# Install act (GitHub Actions runner)
brew install act

# Run workflow
act push -j test
```

### Latest CI Run

- **URL**: https://github.com/Sathvik1533/ecommerce-logistics-platform/actions
- **Latest Status**: Check the Actions tab for most recent run
- **Expected Result**: ✅ All tests passing, 0 failures

### CI Environment Variables

The workflow sets these for testing:

```yaml
SECRET_KEY: test-secret-key-for-ci
DEBUG: True
DB_NAME: test_ecommerce_logistics
DB_USER: root
DB_PASSWORD: testpassword
DB_HOST: 127.0.0.1
CELERY_BROKER_URL: redis://localhost:6379/0  # Note: Not running in CI
```

## Production Deployment Architecture

### Components and Hosting

#### Frontend (React + TypeScript + Vite)

- **Hosting**: Vercel
- **Repository**: Separate `feature/frontend-dashboard` branch (not yet deployed)
- **Environment Variables**:
  ```
  VITE_API_URL=https://api.example.com  # Your production Django URL
  ```
- **Build**: `npm run build` (Vite)
- **Deployment**: Push to `main` on frontend repo triggers Vercel deployment

#### Backend API (Django + Daphne)

- **Hosting**: AWS EC2, Heroku, or similar
- **Process**: Daphne ASGI server (NOT development runserver)
- **Port**: 8000 (or proxy through nginx/cloudflare)
- **Process Manager**: Supervisor, systemd, or container orchestration

**Daphne Startup (Production)**:
```bash
poetry run daphne config.asgi:application -b 0.0.0.0 -p 8000 --verbosity 1
```

#### Database (MySQL 8.4)

- **Hosting**: AWS RDS, Google Cloud SQL, or managed MySQL service
- **Configuration**:
  ```
  ENGINE: dj_db_conn_pool.backends.mysql
  NAME: production_db
  USER: db_user
  PASSWORD: strong_password
  HOST: prod-db.example.com
  PORT: 3306
  POOL_SIZE: 20
  MAX_OVERFLOW: 10
  ```
- **Backups**: Daily automated backups
- **Encryption**: Enable SSL/TLS connections

#### Redis Broker

- **Hosting**: AWS ElastiCache, Redis Cloud, or self-managed
- **Configuration**:
  ```
  CELERY_BROKER_URL=redis://:password@prod-redis.example.com:6379/0
  ```
- **High Availability**: Use Redis Sentinel or Cluster
- **Persistence**: AOF (Append-Only File) enabled

#### Celery Worker(s)

- **Hosting**: Separate EC2 instances or container on Kubernetes
- **Process Manager**: systemd or container orchestration
- **Concurrency**: Adjust based on workload and machine resources
- **Monitoring**: Track active tasks, failed tasks, and worker health

**Celery Startup (Production)**:
```bash
poetry run celery -A config worker --loglevel=warning \
  --concurrency=4 \
  --prefetch-multiplier=4 \
  --max-tasks-per-child=1000
```

### Production Environment Variables

```bash
# Django Core
SECRET_KEY=<generate-a-very-long-random-string>
DEBUG=False
ALLOWED_HOSTS=api.example.com,example.com
ASGI_APPLICATION=config.asgi.application

# Database
DB_NAME=prod_ecommerce
DB_USER=prod_user
DB_PASSWORD=<strong-random-password>
DB_HOST=prod-db.example.com
DB_PORT=3306

# Redis / Celery
CELERY_BROKER_URL=redis://:password@prod-redis.example.com:6379/0

# CORS (React Frontend)
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com

# Email (for future notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<sendgrid-api-key>
```

### Production Checklist

- [ ] `SECRET_KEY` is long, random, and never committed to repository
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_HOSTS` lists only your production domains
- [ ] Database credentials use strong passwords
- [ ] Database connections use SSL/TLS
- [ ] Redis connections authenticated with password
- [ ] Static files served from CDN (Cloudflare, CloudFront, etc.)
- [ ] HTTPS enforced (SSL/TLS certificates from Let's Encrypt or similar)
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Monitoring and logging configured
- [ ] Database backups automated and tested
- [ ] Error tracking configured (Sentry, Rollbar, etc.)
- [ ] Rate limiting and DDoS protection configured
- [ ] Database indexes optimized for query patterns
- [ ] Celery worker health monitoring in place

### Scaling Considerations

**Horizontal Scaling**:
- Deploy multiple Daphne instances behind a load balancer
- Deploy multiple Celery workers for increased task throughput
- Use read replicas for MySQL (for reporting/analytics)

**Vertical Scaling**:
- Increase connection pool sizes as concurrent load increases
- Adjust Celery concurrency based on worker machine resources
- Monitor query performance and optimize slow queries

**Monitoring**:
- Track HTTP response times and error rates
- Monitor task queue depth and worker utilization
- Alert on database connection pool exhaustion
- Monitor Redis memory usage and eviction

## Database Migration Strategy

### Initial Deployment

```bash
poetry run python manage.py migrate
```

### Adding Migrations

1. Make model changes in Django
2. Create migrations: `poetry run python manage.py makemigrations`
3. Test migrations locally
4. Commit to repository
5. Deploy code, then run: `poetry run python manage.py migrate`

### Zero-Downtime Migrations

For large tables in production:
1. Add new column with default value
2. Deploy code that uses both old and new columns
3. Backfill data in background job
4. Deploy code that removes old column references
5. Remove old column in database

## Health Checks and Monitoring

### Liveness Check

```bash
curl http://localhost:8000/health/
```

Expected response (200 OK):
```json
{"status": "ok"}
```

### Application Status

- **Django System Check**: `poetry run python manage.py check`
- **Database Connection**: Test query executes successfully
- **Redis Connection**: `redis-cli ping` returns PONG
- **Celery Worker**: `celery -A config inspect active` returns worker info

### Logs to Monitor

- Django application errors
- Celery task failures and retries
- Database connection pool exhaustion
- Redis connection errors
- Slow query logs

## Rollback Procedure

If a deployment causes issues:

1. **Identify the problem** via monitoring/logs
2. **Revert code**: `git revert <commit-hash>` or redeploy previous version
3. **Run migrations** if database changes were reverted: `poetry run python manage.py migrate`
4. **Verify health checks** pass
5. **Monitor** for continued issues

## Security Notes

- Never commit `.env` files or credentials
- Use environment-specific configurations
- Rotate database passwords regularly
- Enable database audit logging
- Use VPN or security groups to limit database access
- Keep Python dependencies updated (run `poetry update` periodically)
- Monitor security advisories for Django and dependencies

## Troubleshooting

### Connection Pool Exhausted

**Error**: `QueuePool limit of size X overflow Y reached, connection timed out`

**Solution**: Increase `POOL_SIZE` and `MAX_OVERFLOW` in database config

### Redis Connection Refused

**Error**: `ConnectionError: Error 61 connecting to localhost:6379`

**Solution**: 
- Verify Redis is running: `redis-cli ping`
- Check Redis URL in `CELERY_BROKER_URL`
- Verify network connectivity if Redis is remote

### Task Not Dispatched

**Symptom**: Orders created but fulfillment tasks don't run

**Causes**:
- Redis broker is down (check logs for connection errors)
- Celery worker is not running
- `transaction.on_commit()` callback failed silently

**Solution**:
- Verify Redis is running
- Verify Celery worker is running and connected
- Check Django application logs for dispatch failures

### Slow Queries

**Monitor**: Enable MySQL slow query log

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

**Optimize**: Add indexes on frequently queried columns:
```sql
CREATE INDEX idx_order_created_at ON orders(created_at);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

## Disaster Recovery

### Database Loss

1. Restore from backup
2. Re-run migrations if backup is before latest migration
3. Verify data integrity

### Redis Loss

- Tasks in queue are lost (must be retried)
- Celery persists task history to database
- Retrieve failed order IDs and manually trigger fulfillment

### Complete System Failure

1. Restore from backups (database, code repository)
2. Redeploy all services
3. Re-run migrations
4. Verify health checks
5. Monitor for data consistency issues
