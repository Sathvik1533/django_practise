# My Learning Journal — Django E-Commerce Logistics Project

Written in plain English. Captures everything I learned building the order
creation feature for a Django e-commerce logistics backend.

---

## Chapter 1 — How the Request Travels from Browser to Backend

### DNS Resolution
When you type a domain name like www.myshop.com, the computer does not
understand words. It understands IP addresses. DNS (Domain Name System)
translates the domain name into an IP address like 203.0.113.5.

### TCP 3-Way Handshake
Before data is sent, browser and server do a handshake:
1. Browser says: I want to connect (SYN)
2. Server says: I heard you, I am ready (SYN-ACK)
3. Browser says: Great, I am sending data now (ACK)
For HTTPS, there is also a TLS handshake that encrypts everything.

### HTTP Request
The browser sends an HTTP POST with JSON body:
First line = method + path + version
Then headers (metadata)
Then blank line
Then body (the JSON data)

### Nginx (Reverse Proxy)
In production, Nginx sits in front of Django. It receives all requests,
handles SSL, and forwards them to Gunicorn. It also serves static files.

### Gunicorn vs Daphne
Django needs an application server to serve HTTP in production.
Gunicorn is for synchronous Django (WSGI). Most apps use this.
Daphne is for async Django (ASGI). Needed for WebSockets or async views.
For our project, Gunicorn is correct because our views are synchronous.

---

## Chapter 2 — How Django Processes the Request

### CORS
React runs on localhost:3000, Django on localhost:8000.
Different origins. Browser blocks cross-origin requests by default.
Django must add Access-Control-Allow-Origin header to the response.
We use django-cors-headers and configure CORS_ALLOWED_ORIGINS in settings.
Before the real POST, browser sends a preflight OPTIONS request.

### Middleware Pipeline
Every request passes through middleware before reaching the view:
SecurityMiddleware adds security headers
CorsMiddleware checks if origin is allowed
CsrfViewMiddleware validates CSRF tokens
AuthenticationMiddleware loads the user from session
Each runs on the way IN, then in reverse on the way OUT.

### URL Routing
config/urls.py is the parent router: path(api/orders/, include(orders.urls))
orders/urls.py is the child: path('', OrderCreateView.as_view())
as_view() turns the class into a callable, then calls post() method.

---

## Chapter 3 — Inside the Django View

### The View (orders/views.py)
Receives request, validates with serializer, calls service, returns response.

### DRF Parses JSON
The request body is raw JSON text. DRF parses it into a Python dict.
Available as request.data in the view.

### Serializer Validation (orders/serializers.py)
Checks: items is non-empty list, product_id and quantity are positive
integers, no duplicate products. DRF ignores extra fields like unit_price
from client. This is a security feature — backend determines price.

---

## Chapter 4 — The Service Layer (Business Logic)

### Why a Service Layer?
View handles HTTP. Model handles data. Service handles business rules.
This separation lets us test logic without HTTP and reuse it later.

### create_order() Steps
1. validate_order_items() pure Python check
2. transaction.atomic() all or nothing
3. select_for_update() lock inventory rows in MySQL
4. Validate product active, stock sufficient, inventory exists
5. Order.objects.create(status=PENDING)
6. OrderItem.objects.create(unit_price=product.price) snapshot
7. inventory.quantity_reserved += quantity then save
8. return order

### transaction.atomic()
Groups all database operations into one transaction.
Either ALL succeed or ALL roll back.
Like a bank transfer — both steps happen or neither does.

### select_for_update() Row Locking
Without locking: A reads stock=1, B reads stock=1, both reserve = oversold
With locking: A locks row, B waits, A commits, B reads stock=0, error
We order_by(product_id) so both lock in same order — no deadlocks.

### Price Snapshot
OrderItem.unit_price copies Product.price at order time.
Prices change but historical orders must show price paid. Like a receipt.

---

## Chapter 5 — Database Layer

### Django ORM and MySQL
ORM lets us write Python instead of SQL. Django translates automatically.
Order.objects.create() becomes INSERT INTO orders_order ...

### Migrations
makemigrations creates migration files (Python describing schema changes)
migrate applies those changes to MySQL (creates tables)
These run once at setup, not on every request.

### Connection Pooling
Opening MySQL connections is slow. Pooling keeps connections open.
We use dj_db_conn_pool with pool size 10. Borrow a connection,
use it, return it. Much faster than opening new each time.

---

## Chapter 6 — Response Travels Back to Frontend

### View Builds Response
After service creates order, view builds JSON with order_id, status,
items (with unit_price and line_total), total, and created_at.
Returns HTTP 201 Created (not 200) because a new resource was created.

### DRF Serializes Python to JSON
Python dict becomes JSON text string sent over the network.
Django wraps it in an HTTP response with headers.
