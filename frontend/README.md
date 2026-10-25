# E-Commerce Logistics Management Dashboard (Frontend)

Enterprise-grade operations dashboard for the Django E-Commerce Logistics engine, built with React 19, Vite, TypeScript, Tailwind CSS, Lucide icons, and Framer Motion.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v25.8.1)
- npm 9+ (tested on npm 11.11.0)
- Django backend running at `http://localhost:8000` (optional for standalone preview, required for live API calls)

### Installation
```bash
cd frontend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
# In development with Vite proxy, requests to /api/ and /health/
# are automatically proxied to http://localhost:8000
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Run Development Server
```bash
npm run dev
```
The application will launch on **http://localhost:3000** (matching Django's `CORS_ALLOWED_ORIGINS`).

---

## 2. Available Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite dev server on `http://localhost:3000` with HMR and API proxy |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) and Vite production bundle |
| `npm run test` | Executes automated Vitest suite (14 tests across API, Orders, Products, Navigation) |
| `npm run lint` | Runs `oxlint` with 0 warnings/errors policy |
| `npm run preview` | Previews the production build locally |

---

## 3. Real Backend API Integration

The frontend connects to the following genuine endpoints:

### 1. Health Check (`GET /health/`)
- Returns `{"status": "ok"}`
- Live indicator in top navigation bar and sidebar footer.

### 2. Products Catalogue (`GET /api/products/`)
- Returns real warehouse inventory: `[{"id": 1, "name": "...", "price": "...", "available_quantity": ...}]`
- Filtered on active products with inventory records in MySQL.
- Bounded client quantity selection prevents ordering more than `available_quantity`.

### 3. Order Dispatch & Concurrency Locking (`POST /api/orders/`)
- Submits exact JSON schema: `{"items": [{"product_id": number, "quantity": number}]}`
- The Django service locks MySQL rows via `SELECT ... FOR UPDATE` ordered by `product_id`.
- Permanently snapshots unit price on `OrderItem`.
- Prevents double submissions during submission inflight state.
- Automatically refreshes inventory across all dashboard views upon HTTP 201 Created.

---

## 4. Navigation & Feature Status

| Section | Status | Data Source / Description |
|---|---|---|
| **Overview** | **Live** | Warehouse telemetry (Active SKUs, Available Units, Low Stock items) derived from `GET /api/products/`. Unsupported metrics (fake revenue, fake tracking) omitted. |
| **Products & Inventory** | **Live** | Search and filter over live records from `GET /api/products/`. Stock quantity steppers. |
| **Orders** | **Primary Demo** | Multi-item order builder directly submitting to `POST /api/orders/`. Complete HTTP 201 confirmation view showing authoritative snapshot totals. |
| **Inventory Alerts** | **Planned** | Clean architectural specification awaiting Stage 8 Celery threshold alerts. |
| **Fulfillment & Dispatch**| **Planned** | Pick-pack-ship state machine specification awaiting carrier manifest endpoints. |
| **Delivery Tracking** | **Planned** | Courier checkpoint timeline awaiting carrier telemetry webhooks. |
| **Customers** | **Planned** | Directory and profiles awaiting Stage 7 JWT user authentication. |
| **Reports & Analytics** | **Planned** | Throughput statistics awaiting time-series reporting API. |
| **Settings** | **Planned** | Engine configuration awaiting admin RBAC endpoints. |

---

## 5. Architectural Guarantees & Constraints

1. **Backend is the Sole Source of Truth:**
   The frontend never computes authoritative prices, order totals, or stock reservations. Client-side numbers are labeled as preliminary estimates.
2. **Zero Inventions / No Fake Workarounds:**
   Planned sections explicitly state missing endpoints and stage dependencies rather than simulating backend workflows.
3. **No Unauthenticated Pretenses:**
   Authentication is noted as scheduled for Stage 7; no fake login dialogs exist.
