import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  Truck,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Activity,
  Layers,
  X,
} from 'lucide-react';
import type { BackendHealthResponse } from '../types/api';

export type NavTabId =
  | 'overview'
  | 'products'
  | 'orders'
  | 'inventory-alerts'
  | 'fulfillment'
  | 'tracking'
  | 'customers'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  health: BackendHealthResponse | null;
  healthLoading: boolean;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'live' | 'primary' | 'planned';
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: 'CORE NAVIGATION',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: 'Live', badgeType: 'live' },
      { id: 'products', label: 'Products & Inventory', icon: Boxes, badge: 'Live', badgeType: 'live' },
      { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: 'Demo Slice', badgeType: 'primary' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { id: 'inventory-alerts', label: 'Inventory Alerts', icon: AlertTriangle, badge: 'Planned', badgeType: 'planned' },
      { id: 'fulfillment', label: 'Fulfillment & Dispatch', icon: Truck, badge: 'Planned', badgeType: 'planned' },
      { id: 'tracking', label: 'Delivery Tracking', icon: MapPin, badge: 'Planned', badgeType: 'planned' },
    ],
  },
  {
    group: 'MANAGEMENT',
    items: [
      { id: 'customers', label: 'Customers', icon: Users, badge: 'Planned', badgeType: 'planned' },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, badge: 'Planned', badgeType: 'planned' },
      { id: 'settings', label: 'Settings', icon: Settings, badge: 'Planned', badgeType: 'planned' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  health,
  healthLoading,
}) => {
  const isHealthy = health?.status === 'ok';

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-800/80 w-72 text-slate-300">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white tracking-tight text-sm">
                  Logistics Flow
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  SaaS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Order Engine v1.0
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
                {group.group}
              </span>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="tracking-tight">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeType === 'live'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.badgeType === 'primary'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer with Engine Health */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Activity
              className={`h-3.5 w-3.5 ${
                healthLoading
                  ? 'animate-spin text-amber-400'
                  : isHealthy
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            />
            <div>
              <span className="text-[11px] font-medium text-slate-300 block">
                Django Engine
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {healthLoading
                  ? 'Pinging /health/...'
                  : isHealthy
                  ? 'Online • Port 8000'
                  : 'Offline / Error'}
              </span>
            </div>
          </div>

          <div
            className={`h-2 w-2 rounded-full ${
              healthLoading
                ? 'bg-amber-400 animate-pulse'
                : isHealthy
                ? 'bg-emerald-400 ring-4 ring-emerald-500/20'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:hidden transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
