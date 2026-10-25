# Database Schema

**Database Engine:** MySQL 8.0+  
**Database Name:** `ecommerce_logistics` (production) | `test_ecommerce_logistics` (test)  
**Connection Pool:** `dj-db-conn-pool` with MySQLdb driver  
**Character Set:** utf8mb4 (Django default)

---

## Overview

The schema consists of four primary tables implementing a minimal e-commerce order management system:

1. **inventory_product** — Product catalog with pricing
2. **inventory_inventory** — Stock tracking with reservation
3. **orders_order** — Order header with status
4. **orders_orderitem** — Order line items with price snapshots

Plus Django's built-in tables for admin, auth, sessions, and contenttypes.

---

## Tables

### 1. inventory_product

Stores product catalog data. Products can be active or inactive. Only active products with inventory are exposed via `GET /api/products/`.

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(200) | NOT NULL | Product name |
| `sku` | VARCHAR(64) | NOT NULL, UNIQUE | Stock keeping unit identifier |
| `price` | DECIMAL(10, 2) | NOT NULL | Current unit price (authoritative) |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | Product availability flag (1=active, 0=inactive) |
| `created_at` | DATETIME(6) | NOT NULL | Timestamp when product was created |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`sku`)

**Relationships:**
- OneToOne with `inventory_inventory` (FK in Inventory table)
- OneToMany with `orders_orderitem` (FK in OrderItem table, `ON DELETE PROTECT`)

**Notes:**
- `price` changes do not affect existing OrderItem records (price snapshot pattern)
- `is_active = 0` prevents the product from being ordered but preserves historical data
- `PROTECT` on delete prevents deletion of products referenced by orders

---

### 2. inventory_inventory

Tracks stock levels with on-hand and reserved quantities. Enforces the invariant that reserved quantity cannot exceed on-hand quantity.

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `product_id` | BIGINT | FK, NOT NULL, UNIQUE | References `inventory_product(id)` |
| `quantity_on_hand` | INT UNSIGNED | NOT NULL, DEFAULT 0 | Total physical inventory |
| `quantity_reserved` | INT UNSIGNED | NOT NULL, DEFAULT 0 | Inventory reserved by pending orders |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`product_id`)
- FOREIGN KEY (`product_id`) REFERENCES `inventory_product(id)` ON DELETE PROTECT

**Check Constraints:**
```sql
CONSTRAINT reserved_lte_on_hand CHECK (quantity_reserved <= quantity_on_hand)
```

**Computed Field (application-level):**
```python
available_quantity = quantity_on_hand - quantity_reserved
```
This is computed in the application (Django model property) and as a SQL annotation in the product list view. It is **not** a stored database column.

**Relationships:**
- OneToOne with `inventory_product` (inverse: `product.inventory`)

**Transaction Safety:**
- Row-level locking via `SELECT ... FOR UPDATE` during order creation
- Updates occur within `transaction.atomic()` to prevent race conditions
- CHECK constraint prevents invalid reservation state even if application logic fails

**Notes:**
- A Product without an Inventory record cannot be ordered
- `quantity_reserved` is incremented when orders are created (status=pending)
- Reserved quantity would be decremented on order cancellation (not yet implemented)
- Available quantity can be zero (product shown but not orderable)

---

### 3. orders_order

Order header table. Stores order-level metadata. Line items are in the separate `orders_orderitem` table.

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key (exposed as `order_id` in API) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Enum: `pending`, `confirmed`, `cancelled` |
| `created_at` | DATETIME(6) | NOT NULL | Order creation timestamp |
| `updated_at` | DATETIME(6) | NOT NULL | Last modification timestamp (auto-updated) |

**Indexes:**
- PRIMARY KEY (`id`)

**Relationships:**
- OneToMany with `orders_orderitem` (reverse: `order.items`)

**Status Transitions:**

Current implementation only creates orders with `status = 'pending'`. Future workflows would implement:
- `pending` → `confirmed` (payment received, ready to ship)
- `pending` → `cancelled` (customer cancellation, stock returned)
- `confirmed` → `cancelled` (post-confirmation cancellation, refund)

**Notes:**
- No user association yet (would add `user_id` FK when JWT auth is implemented)
- No soft-delete — orders are permanent records
- `created_at` is immutable, `updated_at` changes on any save

---

### 4. orders_orderitem

Order line items. Each row represents one product in an order. The `unit_price` field captures the price at order time (price snapshot).

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `order_id` | BIGINT | FK, NOT NULL | References `orders_order(id)` |
| `product_id` | BIGINT | FK, NOT NULL | References `inventory_product(id)` |
| `quantity` | INT UNSIGNED | NOT NULL | Quantity ordered |
| `unit_price` | DECIMAL(10, 2) | NOT NULL | Price snapshot from `inventory_product.price` at order time |

**Indexes:**
- PRIMARY KEY (`id`)
- FOREIGN KEY (`order_id`) REFERENCES `orders_order(id)` ON DELETE CASCADE
- FOREIGN KEY (`product_id`) REFERENCES `inventory_product(id)` ON DELETE PROTECT

**Check Constraints:**
```sql
CONSTRAINT order_item_quantity_gt_zero CHECK (quantity > 0)
CONSTRAINT order_item_unit_price_nonnegative CHECK (unit_price >= 0)
```

**Computed Field (application-level):**
```python
line_total = quantity * unit_price
```
Computed in Python (Django model property), not stored in the database.

**Relationships:**
- ManyToOne with `orders_order` (inverse: `item.order`)
- ManyToOne with `inventory_product` (inverse: `product.order_items`)

**Price Snapshot Behavior:**

When an OrderItem is created:
1. `unit_price` is set to `product.price` at that exact moment
2. The value is **never updated**, even if `product.price` changes later
3. This preserves historical pricing for accounting and audit purposes
4. The API response `line_total` and `total` are computed from these snapshots

**ON DELETE Behavior:**
- `CASCADE` on `order_id` — deleting an Order deletes all its items (keeps referential integrity)
- `PROTECT` on `product_id` — cannot delete a Product referenced by OrderItems (preserves audit trail)

**Notes:**
- No unique constraint on `(order_id, product_id)` — theoretically the same product could appear twice in an order, but application logic currently prevents this
- CHECK constraints enforce positive quantity and non-negative price at the database level

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│ inventory_product   │
│─────────────────────│
│ id (PK)            │
│ name               │
│ sku (UNIQUE)       │
│ price              │◄──────────────┐
│ is_active          │               │
│ created_at         │               │ (price snapshot)
└─────────────────────┘               │
         │ 1:1                        │
         │                            │
         ▼                            │
┌─────────────────────┐               │
│ inventory_inventory │               │
│─────────────────────│               │
│ id (PK)            │               │
│ product_id (FK)    │               │
│ quantity_on_hand   │               │
│ quantity_reserved  │               │
│ CHECK: reserved <= on_hand         │
└─────────────────────┘               │
                                      │
                                      │
┌─────────────────────┐               │
│ orders_order        │               │
│─────────────────────│               │
│ id (PK)            │               │
│ status             │               │
│ created_at         │               │
│ updated_at         │               │
└─────────────────────┘               │
         │ 1:N                        │
         │                            │
         ▼                            │
┌─────────────────────┐               │
│ orders_orderitem    │               │
│─────────────────────│               │
│ id (PK)            │               │
│ order_id (FK)      │               │
│ product_id (FK)    │───────────────┘
│ quantity           │
│ unit_price         │  ← snapshot
│ CHECK: quantity > 0
│ CHECK: unit_price >= 0
└─────────────────────┘
```

---

## Transaction Boundaries

### Order Creation Transaction

The `create_order()` service function wraps the entire order creation process in a single atomic transaction:

```python
with transaction.atomic():
    # 1. Acquire row locks on inventory (SELECT ... FOR UPDATE)
    # 2. Validate stock availability and product status
    # 3. Create Order record (status=pending)
    # 4. Create OrderItem records with price snapshots
    # 5. Increment quantity_reserved in Inventory
```

**Guarantees:**
- All five steps succeed together or none succeed (atomicity)
- Inventory locks prevent concurrent orders from overselling
- Database CHECK constraints act as final validation
- Rollback on any error leaves the database unchanged

**Ordering Strategy:**
Inventory rows are locked in `product_id` ascending order to prevent deadlocks when two transactions attempt to reserve the same set of products.

---

## Data Invariants

These invariants are enforced by a combination of database constraints, application logic, and transaction boundaries:

1. **Inventory Consistency:**
   - `quantity_reserved <= quantity_on_hand` (CHECK constraint)
   - Reserved quantity can only increase during order creation (no cancellation yet)

2. **Price Integrity:**
   - `OrderItem.unit_price` is immutable after creation (application rule)
   - Changing `Product.price` does not affect existing orders (isolation)

3. **Order Atomicity:**
   - An order is fully created with all items or not created at all (transaction.atomic)
   - No partial orders exist in the database (tested)

4. **Stock Reservation:**
   - Inventory is reserved when `Order.status = 'pending'` (application logic)
   - Insufficient stock prevents order creation (tested)

5. **Referential Integrity:**
   - Cannot delete a Product referenced by OrderItems (ON DELETE PROTECT)
   - Deleting an Order cascades to its OrderItems (ON DELETE CASCADE)
   - Cannot order a Product without an Inventory record (application logic)

6. **Concurrency (Partial):**
   - Row-level locking prevents double-booking of inventory
   - **NOT stress-tested** — concurrency safety is assumed but not verified

---

## Sample Data

**Create a test product:**
```sql
INSERT INTO inventory_product (name, sku, price, is_active, created_at)
VALUES ('Test Laptop', 'LAP-001', 1500.00, 1, NOW());

INSERT INTO inventory_inventory (product_id, quantity_on_hand, quantity_reserved)
VALUES (LAST_INSERT_ID(), 100, 0);
```

**Create an order (simulated — normally done via API):**
```sql
BEGIN;

-- Lock inventory
SELECT id, product_id, quantity_on_hand, quantity_reserved
FROM inventory_inventory
WHERE product_id = 1
FOR UPDATE;

-- Create order
INSERT INTO orders_order (status, created_at, updated_at)
VALUES ('pending', NOW(), NOW());
SET @order_id = LAST_INSERT_ID();

-- Create order item with price snapshot
INSERT INTO orders_orderitem (order_id, product_id, quantity, unit_price)
SELECT @order_id, id, 2, price
FROM inventory_product
WHERE id = 1;

-- Reserve inventory
UPDATE inventory_inventory
SET quantity_reserved = quantity_reserved + 2
WHERE product_id = 1;

COMMIT;
```

---

## Migration Files

**Inventory:**
- `inventory/migrations/0001_initial.py`
  - Creates `inventory_product` table
  - Creates `inventory_inventory` table
  - Adds `reserved_lte_on_hand` CHECK constraint

**Orders:**
- `orders/migrations/0001_initial.py`
  - Creates `orders_order` table
  - Creates `orders_orderitem` table
  - Adds `order_item_quantity_gt_zero` CHECK constraint
  - Adds `order_item_unit_price_nonnegative` CHECK constraint

All migrations are applied. Verify with:
```bash
poetry run python manage.py showmigrations
```

---

## Database Configuration

**Local Development:**

Environment variables in `.env`:
```
DB_NAME=ecommerce_logistics
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

**settings.py:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'dj_db_conn_pool.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'ecommerce_logistics'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'POOL_OPTIONS': {
            'POOL_SIZE': 10,
            'MAX_OVERFLOW': 10,
        },
    }
}
```

**Connection Pooling:**

Using `dj-db-conn-pool` to maintain a pool of 10 persistent MySQL connections with up to 10 overflow connections. This reduces connection overhead for high-traffic scenarios.

---

## Future Schema Changes

**When JWT authentication is added:**
- Add `user_id` FK to `orders_order` referencing `auth_user(id)`
- Add NOT NULL constraint after backfilling existing orders

**When order cancellation is implemented:**
- Decrement `inventory_inventory.quantity_reserved` on cancel
- Update `orders_order.status` to `'cancelled'`
- Consider adding `cancelled_at` timestamp

**When background tasks (Celery) are added:**
- No schema changes required (tasks are transient, not stored)

---

## Backup and Recovery

**Not yet implemented.** Production deployment should include:
- Automated daily MySQL dumps
- Point-in-time recovery via binlog
- Replica for read scaling and failover

---

## Performance Considerations

**Current indexes:**
- All PKs and FKs are indexed automatically
- `inventory_product.sku` has a UNIQUE index
- No additional indexes yet

**Future optimization opportunities:**
- Index on `orders_order.status` if filtering by status becomes common
- Index on `orders_order.created_at` for time-range queries
- Composite index on `(is_active, product_id)` for product filtering

**Query performance:**
- Product list query annotates `available_quantity` in SQL (efficient)
- Order creation locks inventory rows (necessary for correctness, may limit throughput)
- No N+1 queries — order creation uses `select_related()` to fetch products with inventory in one query

---

## Testing

Database-backed tests are in:
- `inventory/tests.py` — 7 tests
- `orders/tests.py` — 18 tests

Tests use Django's `TestCase` which:
- Creates a test database (`test_ecommerce_logistics`)
- Wraps each test in a transaction and rolls it back (isolation)
- Runs against real MySQL (not SQLite) to verify MySQL-specific behavior like CHECK constraints

Run tests:
```bash
poetry run python manage.py test
```
