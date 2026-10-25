import React from 'react';
import {
  Boxes,
  ShoppingCart,
  LayoutDashboard,
  AlertTriangle,
  Truck,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Package,
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
  health?: BackendHealthResponse | null;
  healthLoading?: boolean;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isPlanned?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'products', label: 'Products & Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
];

const PLANNED_NAV: NavItem[] = [
  { id: 'inventory-alerts', label: 'Inventory Alerts', icon: AlertTriangle, isPlanned: true },
  { id: 'fulfillment', label: 'Fulfillment & Dispatch', icon: Truck, isPlanned: true },
  { id: 'tracking', label: 'Delivery Tracking', icon: MapPin, isPlanned: true },
  { id: 'customers', label: 'Customers', icon: Users, isPlanned: true },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, isPlanned: true },
  { id: 'settings', label: 'Settings', icon: Settings, isPlanned: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-[#E5E5E2] w-64 text-[#242424]">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E5E5E2] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded bg-[#E96832] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[#242424] block">
                Logistics Flow
              </span>
              <span className="text-[11px] text-[#71717A] block">
                Warehouse Operations
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Operational Workflows */}
        <div className="p-3">
          <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-[#71717A] uppercase">
            Operations
          </div>
          <nav className="space-y-1">
            {PRIMARY_NAV.map((item) => {
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#FFF5F0] text-[#E96832] font-semibold border border-[#FCD8C8]'
                      : 'text-[#52525B] hover:text-[#242424] hover:bg-[#F8F7F4]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-[#E96832]' : 'text-[#71717A]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'orders' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#E96832]/10 text-[#E96832]">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Demoted / Planned Destinations */}
        <div className="p-3 border-t border-[#E5E5E2] mt-2">
          <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-[#A1A1AA] uppercase">
            Planned
          </div>
          <nav className="space-y-0.5">
            {PLANNED_NAV.map((item) => {
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
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition ${
                    isActive
                      ? 'bg-[#F8F7F4] text-[#242424] font-medium'
                      : 'text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="h-3.5 w-3.5 text-[#A1A1AA]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-[#A1A1AA] font-mono">
                    Planned
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Clean, Non-intrusive Operational Context Footer */}
      <div className="p-3 border-t border-[#E5E5E2] bg-[#F8F7F4]/60 text-[11px] text-[#71717A]">
        <span>Workspace: Primary Fulfillment</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
        />
      )}

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
