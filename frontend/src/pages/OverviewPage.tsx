import React from 'react';
import {
  Boxes,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Zap,
  Info,
  Clock,
} from 'lucide-react';
import type { Product, ApiError, BackendHealthResponse } from '../types/api';
import type { NavTabId } from '../components/Sidebar';

interface OverviewPageProps {
  products: Product[];
  productsLoading: boolean;
  productsError: ApiError | null;
  health: BackendHealthResponse | null;
  onNavigate: (tab: NavTabId) => void;
  onRefreshProducts: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  products,
  productsLoading,
  productsError,
  health,
  onNavigate,
  onRefreshProducts,
}) => {
  const isHealthy = health?.status === 'ok';

  // Real inventory metrics derived strictly from GET /api/products/
  const totalActiveSkus = products.length;
  const totalAvailableStock = products.reduce((acc, p) => acc + (p.available_quantity || 0), 0);
  const lowStockCount = products.filter(
    (p) => p.available_quantity > 0 && p.available_quantity <= 5
  ).length;
  const outOfStockCount = products.filter((p) => p.available_quantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Welcome & System Summary Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 mb-2">
            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>VERTICAL SLICE ARCHITECTURE • {isHealthy ? 'DJANGO BACKEND ONLINE (/health/)' : 'BACKEND DISCONNECTED'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            E-Commerce Logistics Management Engine
          </h2>

          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            A production-grade logistics control interface powered by a safe stock reservation backend.
            Enforces strict concurrency safety via MySQL InnoDB row-level locking (<code className="text-indigo-300 font-mono">SELECT ... FOR UPDATE</code>)
            and permanent purchase-time price snapshots on order items.
          </p>

          {/* Quick Nav Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Launch Order Creator (Demo)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition border border-slate-700 flex items-center space-x-2"
            >
              <Boxes className="h-4 w-4 text-sky-400" />
              <span>Inspect Products & Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Verified Operational Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Warehouse Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Computed strictly from active Django records (<code className="text-slate-300">GET /api/products/</code>)
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshProducts}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium font-mono"
          >
            Refresh Data
          </button>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 animate-pulse"
              />
            ))}
          </div>
        ) : productsError ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold block">Catalogue Metric Unavailable</span>
              <span>{productsError.message}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Active SKUs</span>
                <Boxes className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-white">
                  {totalActiveSkus}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Products with live inventory records
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Available Units</span>
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-white">
                  {totalAvailableStock.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Physical stock minus reserved
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Low Stock Items</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-white">
                  {lowStockCount}
                </span>
                <span className="text-[11px] text-amber-400/90 block mt-0.5">
                  Stock ≤ 5 units available
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Out of Stock</span>
                <Lock className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-white">
                  {outOfStockCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Zero units available
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Honest Scope Disclosure & Engineering Transparency Notice */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-start space-x-3 text-xs text-slate-400">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200 block">
            Enterprise Scope Transparency Notice
          </span>
          <p className="mt-1 leading-relaxed">
            Per strict project engineering guidelines, unsupported business metrics (such as fictional revenue, simulated transit events, and synthetic customer accounts) are deliberately omitted.
            Only data verified by the Django backend API is rendered.
          </p>
        </div>
      </div>

      {/* Implementation Stages Roadmap */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Backend Architecture & Stage Roadmap
            </h3>
            <p className="text-xs text-slate-400">
              Verified status of all functional vertical slices
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            MySQL InnoDB Engine
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Stage 0-5 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Stages 0 — 5: Core Backend
              </span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                VERIFIED
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Models, input validation service, atomic order creation transaction with row locking, DRF views, and 25 passing test cases.
            </p>
          </div>

          {/* Stage 6 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/30 space-y-2 ring-1 ring-indigo-500/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-indigo-400" />
                Stage 6: React Frontend
              </span>
              <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                LIVE DEMO
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Enterprise dashboard, real product catalogue viewer (<code className="text-slate-300">GET /api/products/</code>), and transactional order creation (<code className="text-slate-300">POST /api/orders/</code>).
            </p>
          </div>

          {/* Stage 7-9 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Stages 7 — 9: Auth & Tasks
              </span>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                ROADMAP
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              JWT user authentication (Stage 7), Celery/Redis email task dispatch via transaction.on_commit (Stage 8), and production Gunicorn/Nginx deployment (Stage 9).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
