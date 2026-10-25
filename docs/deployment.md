# Deployment Guide

**Target Environment:** Production (undefined — see Blockers)  
**CI/CD:** GitHub Actions  
**Database:** MySQL 8.0+  
**Application Server:** Not yet configured

---

## CI/CD Pipeline

### GitHub Actions Workflow

**Location:** `.github/workflows/django-tests.yml`

**Triggers:**
- Push to `main` branch
- Pull requests targeting `main`

**Pipeline Steps:**

1. **Checkout Code** — fetches the repository
2. **Set Up Python 3.13** — installs Python runtime
3. **Install Poetry** — installs Poetry 2.5.1 for dependency management
4. **Cache Dependencies** — caches `.venv` to speed up subsequent runs
5. **Install Dependencies** — runs `poetry install`
6. **Start MySQL Service** — GitHub Actions service container with MySQL 8.0
7. **Wait for MySQL** — health check with retry loop
8. **Run Django System Checks** — `python manage.py check`
9. **Run Migrations** — `python manage.py migrate` against test database
10. **Run Tests** — `python manage.py test --verbosity=2` (all 25 tests)

**Test Database:**
- MySQL 8.0 service container
- Database: `test_ecommerce_logistics`
- User: `root`
- Password: `testpassword` (CI only, not in production)
- Host: `127.0.0.1`
- Port: `3306`

**CI Environment Variables:**
- `SECRET_KEY`: `test-secret-key-for-ci` (CI only)
- `DEBUG`: `True` (CI only)
- `ALLOWED_HOSTS`: `localhost,127.0.0.1`
- `DB_*`: MySQL connection details
- `CORS_ALLOWED_ORIGINS`: `http://localhost:3000`

**Status Badge:**

Add to README.md:
```markdown
![Django Tests](https://github.com/Sathvik1533/django_practise/actions/workflows/django-tests.yml/badge.svg)
```

**View Workflow Results:**
```
https://github.com/Sathvik1533/django_practise/actions
```

---

## Deployment Architecture (Planned)

### Current Status: NOT DEPLOYED

**Blockers:**
1. No production hosting environment configured (AWS, Render, Railway, DigitalOcean, etc.)
2. No production database provisioned
3. No DNS domain registered
4. No TLS/SSL certificate configured
5. No deployment credentials (AWS keys, Render API token, etc.)

### Proposed Architecture

**Option A: Railway (Recommended for MVP)**

```
User → DNS → Railway Edge → Gunicorn → Django → Railway MySQL
                  ↓
               TLS Termination
```

**Advantages:**
- Zero-config MySQL database
- Automatic HTTPS/TLS
- GitHub integration (auto-deploy on push)
- Free tier available
- No infrastructure management

**Option B: AWS (Production-grade)**

```
User → Route 53 → ALB → EC2/ECS → Django → RDS MySQL
         (DNS)    (TLS)  (Gunicorn)      (Managed DB)
```

**Advantages:**
- Full control
- Scalability
- VPC network isolation
- Managed RDS with automated backups

**Disadvantages:**
- More complex setup
- Higher cost
- Requires AWS expertise

---

## Request Flow (Production)

### DNS Resolution

1. **User enters domain** (e.g., `https://ecommerce-api.example.com`)
2. **Browser queries DNS** for `ecommerce-api.example.com`
3. **DNS resolver returns** an IP address (e.g., `34.123.45.67`) or CNAME record pointing to the hosting provider's load balancer
4. **Browser establishes TCP connection** to that IP address on port 443 (HTTPS)

**What DNS Does:**
- Translates domain names to IP addresses (or other DNS records like CNAME, ALIAS)
- Does NOT translate "English words to computer-readable integers" — it maps names to network addresses

**What DNS Does NOT Do:**
- Inspect URL paths (`/api/products/`)
- Process HTTP requests
- Execute application logic
- Translate URLs to arbitrary numbers

**IP Address vs Domain Name:**
- **IP Address**: Numeric network address (e.g., `192.168.1.1`) identifying a machine on the internet
- **Domain Name**: Human-readable label (e.g., `example.com`) that maps to an IP via DNS
- **URL**: Complete resource locator including protocol, domain, path (e.g., `https://example.com/api/products/`)

### HTTPS/TLS Termination

1. **Browser initiates TLS handshake** with the server at the resolved IP
2. **Server presents TLS certificate** (validated against domain name)
3. **Encrypted tunnel established** (all HTTP traffic encrypted)

**Where TLS Terminates:**
- Railway/Render: At the edge proxy (automatic)
- AWS: At the Application Load Balancer (ALB) or CloudFront
- Self-hosted: At Nginx reverse proxy

### Reverse Proxy / Load Balancer

1. **Decrypts HTTPS** (if TLS terminated here)
2. **Routes request** to application server (Gunicorn)
3. **May perform:**
   - Load balancing across multiple app instances
   - Rate limiting
   - Request logging
   - Static file serving (if configured)

**Examples:**
- Railway: Built-in edge proxy
- AWS: Application Load Balancer (ALB)
- Self-hosted: Nginx

### Application Server (Gunicorn)

1. **Receives HTTP request** from reverse proxy
2. **Spawns/reuses worker process** to handle request
3. **Passes request to Django** via WSGI interface

**Gunicorn Configuration (example):**
```bash
gunicorn config.wsgi:application \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --timeout 30 \
  --access-logfile -
```

### Django Application

1. **URL Routing** — `config/urls.py` matches path to view
2. **Middleware** — CORS, sessions, security (runs before view)
3. **View Execution** — `OrderCreateView`, `ProductListView`, etc.
4. **Service Layer** — `create_order()` business logic
5. **Database Query** — ORM translates to SQL, executes against MySQL
6. **MySQL Transaction** — `transaction.atomic()`, row locks, commit/rollback
7. **Response Serialization** — DRF serializer converts models to JSON
8. **HTTP Response** — status code, headers, JSON body

### Response Path

1. Django → Gunicorn → Reverse Proxy → TLS encryption → DNS (reverse lookup not needed) → User's browser

### Complete Request Lifecycle Example

**User Action:** `POST https://ecommerce-api.example.com/api/orders/`

1. **DNS Query:** Browser resolves `ecommerce-api.example.com` → `34.123.45.67`
2. **TCP Connection:** Browser connects to `34.123.45.67:443`
3. **TLS Handshake:** Encrypted channel established, certificate validated
4. **HTTP Request:** `POST /api/orders/` with JSON body sent over encrypted channel
5. **Reverse Proxy:** Decrypts, forwards to Gunicorn at `http://127.0.0.1:8000/api/orders/`
6. **Gunicorn:** Passes request to Django worker
7. **Django Routing:** `config/urls.py` → `orders/urls.py` → `OrderCreateView`
8. **Middleware:** CORS check (origin allowed), authentication (future JWT)
9. **View:** Deserializes JSON, calls `create_order(items)`
10. **Service:** `transaction.atomic()` starts, `select_for_update()` locks inventory
11. **MySQL:** Executes `SELECT ... FOR UPDATE`, `INSERT`, `UPDATE` queries
12. **Transaction Commit:** All changes persisted atomically
13. **Serializer:** `OrderSerializer` converts Order model to JSON
14. **Response:** HTTP 201 with JSON body
15. **Gunicorn → Reverse Proxy:** Returns response
16. **TLS Encryption:** Response encrypted
17. **Browser:** Receives 201, decrypts, parses JSON, displays order confirmation

---

## Environment Variables (Production)

**Required Environment Variables:**

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key (must be random, 50+ chars) | `<random-string>` |
| `DEBUG` | **Must be False in production** | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed domains | `ecommerce-api.example.com,api.example.com` |
| `DB_NAME` | MySQL database name | `ecommerce_logistics_prod` |
| `DB_USER` | MySQL username | `django_user` |
| `DB_PASSWORD` | MySQL password (secret) | `<strong-password>` |
| `DB_HOST` | MySQL host | `prod-db.example.com` or `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) | `https://ecommerce-frontend.example.com` |

**Additional Variables (when JWT/Redis/Celery are added):**

| Variable | Description |
|---|---|
| `JWT_ACCESS_TOKEN_LIFETIME` | JWT access token validity (minutes) |
| `JWT_REFRESH_TOKEN_LIFETIME` | JWT refresh token validity (days) |
| `REDIS_URL` | Redis connection string for Celery |
| `CELERY_BROKER_URL` | Celery message broker URL |

**Security Notes:**
- **NEVER commit `.env` to Git**
- Use hosting provider's secret management (Railway secrets, AWS Secrets Manager, etc.)
- Rotate `SECRET_KEY` if exposed
- Use strong database passwords (16+ characters, mixed case, numbers, symbols)

---

## Migration Procedure

### Initial Deployment

1. **Provision MySQL Database** on hosting provider
2. **Set Environment Variables** in hosting provider dashboard
3. **Deploy Application Code** (via Git push or CLI)
4. **Run Migrations:**
   ```bash
   python manage.py migrate
   ```
5. **Create Superuser** (for Django admin):
   ```bash
   python manage.py createsuperuser
   ```
6. **Load Initial Data** (products, inventory):
   ```bash
   python manage.py shell
   # Run product creation script from frontend-integration.md
   ```

### Subsequent Deployments

When database schema changes (new models, fields, constraints):

1. **Create Migration Locally:**
   ```bash
   poetry run python manage.py makemigrations
   ```
2. **Test Migration Locally:**
   ```bash
   poetry run python manage.py migrate
   poetry run python manage.py test
   ```
3. **Commit Migration File:**
   ```bash
   git add */migrations/*.py
   git commit -m "feat: add migration for X"
   git push
   ```
4. **Deploy to Production** (triggers auto-deploy on Railway/Render)
5. **Run Migration in Production:**
   ```bash
   # Railway:
   railway run python manage.py migrate
   
   # Render:
   # (Migrations auto-run if configured in render.yaml)
   
   # Manual SSH:
   ssh user@server
   cd /app
   python manage.py migrate
   ```

**Migration Safety:**
- Always test migrations locally first
- Avoid destructive changes (DROP COLUMN, DROP TABLE) without backup
- Use `--fake` flag only if you understand the consequences
- For zero-downtime deployments, use additive migrations (new columns nullable or with defaults)

---

## Health Check

**Endpoint:** `GET /health/`

**Expected Response:**
```json
{
  "status": "ok"
}
```

**Use Cases:**
- Load balancer health check
- Uptime monitoring (UptimeRobot, Pingdom, etc.)
- CI/CD smoke test after deployment

**Limitations:**
- Does not verify database connectivity
- Does not verify Redis/Celery (when added)
- Consider adding `/api/health/` with database ping for deeper checks

---

## Rollback Strategy

### Railway/Render

**Manual Rollback via Dashboard:**
1. Navigate to deployment history
2. Select previous successful deployment
3. Click "Redeploy" or "Rollback"

**Git-based Rollback:**
```bash
# Revert last commit
git revert HEAD
git push

# Or reset to previous commit (destructive)
git reset --hard <previous-commit-hash>
git push --force  # WARNING: only use if you understand the risk
```

### AWS/Manual Deployment

**Blue-Green Deployment (Recommended):**
1. Deploy new version to separate environment (green)
2. Test green environment
3. Switch traffic to green via load balancer
4. Keep blue environment for rollback

**Direct Rollback:**
1. Redeploy previous Docker image/EC2 AMI
2. Revert database migrations if necessary (risky)

**Database Rollback:**

**If migration broke database:**
1. Restore from backup (requires pre-configured automated backups)
2. Or manually reverse migration:
   ```bash
   python manage.py migrate orders <previous-migration-number>
   ```

---

## Monitoring and Logging

**Not yet configured.** Production should include:

1. **Application Logs:**
   - Django logs to stdout (captured by Railway/Render)
   - Structured logging (JSON) for parsing
   - Log aggregation (CloudWatch, Datadog, Logtail)

2. **Error Tracking:**
   - Sentry for exception monitoring
   - Alerts on 500 errors

3. **Performance Monitoring:**
   - APM tool (New Relic, Scout, Elastic APM)
   - Track slow queries, endpoint latency

4. **Uptime Monitoring:**
   - External health check (UptimeRobot, Pingdom)
   - Alerts on downtime

5. **Database Monitoring:**
   - Connection pool usage
   - Slow query log
   - Disk space alerts

---

## Security Checklist

**Before Production Deployment:**

- [ ] `DEBUG = False` in production settings
- [ ] `SECRET_KEY` is random and secret (not in Git)
- [ ] Database password is strong and secret
- [ ] HTTPS/TLS enabled (enforced)
- [ ] `ALLOWED_HOSTS` restricted to actual domains (not `*`)
- [ ] CORS origins restricted to frontend domain only
- [ ] Database backups configured
- [ ] Firewall rules limit database access
- [ ] Django security middleware enabled (already in settings.py)
- [ ] SQL injection prevented (ORM used throughout)
- [ ] XSS prevented (DRF auto-escapes JSON)
- [ ] CSRF protection enabled (Django default)
- [ ] Rate limiting configured (future)
- [ ] Input validation on all API endpoints (already implemented)

---

## Manual Verification Steps (Post-Deployment)

1. **Health Check:**
   ```bash
   curl https://your-domain.com/health/
   ```

2. **Product List:**
   ```bash
   curl https://your-domain.com/api/products/
   ```

3. **Create Order:**
   ```bash
   curl -X POST https://your-domain.com/api/orders/ \
     -H "Content-Type: application/json" \
     -d '{"items": [{"product_id": 1, "quantity": 1}]}'
   ```

4. **Verify Database Persistence:**
   ```bash
   # SSH into production server or use database client
   mysql -u <user> -p <database>
   SELECT * FROM orders_order ORDER BY id DESC LIMIT 1;
   SELECT * FROM orders_orderitem WHERE order_id = <last_order_id>;
   SELECT * FROM inventory_inventory WHERE product_id = 1;
   # Verify quantity_reserved was incremented
   ```

5. **Frontend Integration:**
   - Open frontend at `https://your-frontend-domain.com`
   - Verify products load
   - Place a test order
   - Confirm order appears in database

---

## Deployment Blockers (Current Status)

**Cannot deploy to production until:**

1. **Hosting Environment Selected**
   - Decision: Railway? AWS? Render? DigitalOcean?
   - Recommendation: Railway for simplicity, AWS for scale

2. **Database Provisioned**
   - MySQL 8.0+ instance with persistent storage
   - Automated backups configured
   - Connection credentials generated

3. **Domain Registered (Optional but Recommended)**
   - Register domain (e.g., `ecommerce-api.example.com`)
   - Configure DNS A/CNAME records
   - Or use hosting provider's subdomain (e.g., `yourapp.railway.app`)

4. **Deployment Credentials Configured**
   - GitHub Actions secrets for deployment (if using automated CD)
   - Or manual deployment via CLI (Railway CLI, AWS CLI, etc.)

5. **Environment Variables Set**
   - All production secrets configured in hosting provider dashboard
   - `.env` file is NOT used in production (secrets in environment)

6. **Gunicorn / Production Server Configured**
   - `Procfile` (for Railway/Render):
     ```
     web: gunicorn config.wsgi:application --workers 4 --bind 0.0.0.0:$PORT
     ```
   - Or `Dockerfile` for containerized deployment

---

## Next Steps for Production Deployment

1. **Choose Hosting Provider** → I recommend Railway for MVP
2. **Provision MySQL Database** → Via Railway or separate service
3. **Add `Procfile`** → Define how to run the application
4. **Set Environment Variables** → In Railway dashboard
5. **Connect GitHub Repository** → Enable auto-deploy on push to `main`
6. **Deploy** → Push to main or manual deploy via CLI
7. **Run Migrations** → `railway run python manage.py migrate`
8. **Load Initial Data** → Create products via Django admin or shell
9. **Update Frontend** → Point React app to production API URL
10. **Test End-to-End** → Verify full user flow works

---

## Cost Estimate (Railway, MVP Scale)

- **Railway Hobby Plan:** $5/month
  - Includes: Web service, MySQL database, 500 hours/month
  - Sufficient for MVP with <1000 requests/day
- **Railway Pro Plan:** $20/month (if scaling beyond hobby limits)
- **Domain Registration:** $10-15/year (optional)

---

**Last Updated:** 2024-10-24  
**Status:** CI configured, production deployment not yet started  
**Deployment Target:** TBD (awaiting user decision on hosting provider)
