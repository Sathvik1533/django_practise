import React from 'react';
import { Menu, Activity, RefreshCw, Database } from 'lucide-react';
import type { BackendHealthResponse } from '../types/api';
import type { NavTabId } from './Sidebar';

interface TopNavProps {
  currentTab: NavTabId;
  onOpenMobile: () => void;
  health: BackendHealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

const TAB_TITLES: Record<NavTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Operations Overview',
    subtitle: 'High-level status of the e-commerce logistics engine',
  },
  products: {
    title: 'Products & Inventory',
    subtitle: 'Real warehouse catalogue backed by MySQL InnoDB',
  },
  orders: {
    title: 'Orders Management',
    subtitle: 'Atomic order placement with row-level stock reservation',
  },
  'inventory-alerts': {
    title: 'Inventory Alerts',
    subtitle: 'Automated threshold notifications and replenishment triggers',
  },
  fulfillment: {
    title: 'Fulfillment & Dispatch',
    subtitle: 'Warehouse packing and carrier handoff operations',
  },
  tracking: {
    title: 'Delivery Tracking',
    subtitle: 'Real-time courier telemetry and consignment monitoring',
  },
  customers: {
    title: 'Customer Directory',
    subtitle: 'Account profiles and multi-tenant order histories',
  },
  reports: {
    title: 'Reports & Analytics',
    subtitle: 'Throughput statistics, inventory turnover, and fulfillment SLAs',
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Application configuration, database pool, and environment parameters',
  },
};

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onOpenMobile,
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const current = TAB_TITLES[currentTab] || {
    title: 'Dashboard',
    subtitle: 'Logistics Engine',
  };

  const isHealthy = health?.status === 'ok';

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      {/* Left: Mobile Menu button + Title */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Architecture & Status Badges */}
      <div className="flex items-center space-x-3">
        <div className="hidden lg:flex items-center space-x-2 text-xs px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400">
          <Database className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-mono text-[11px]">MySQL 8 • InnoDB Locking</span>
        </div>

        <button
          type="button"
          onClick={onRefreshHealth}
          disabled={healthLoading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-xs font-mono transition"
          title="Click to re-ping GET /health/"
        >
          <Activity
            className={`h-3.5 w-3.5 ${
              healthLoading
                ? 'animate-spin text-amber-400'
                : isHealthy
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          />
          <span className="text-slate-300">API:</span>
          {healthLoading ? (
            <span className="text-amber-400">Pinging...</span>
          ) : isHealthy ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          ) : (
            <span className="text-rose-400 font-semibold">Offline</span>
          )}
          <RefreshCw className={`h-3 w-3 text-slate-500 hover:text-slate-300 ${healthLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
