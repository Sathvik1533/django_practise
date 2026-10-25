import React from 'react';
import { Menu, Plus, Package } from 'lucide-react';
import type { NavTabId } from './Sidebar';

interface TopNavProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenMobile: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobile,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E5E5E2] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
      {/* Left: Mobile Menu button + Brand */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-1.5 rounded text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4] border border-[#E5E5E2]"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded bg-[#E96832] flex items-center justify-center text-white shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#242424]">
              <span className="sm:hidden">Logistics</span>
              <span className="hidden sm:inline">Logistics Operations</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Clean Primary Operational Tabs (Desktop) */}
      <div className="hidden sm:flex items-center space-x-1">
        <button
          type="button"
          onClick={() => onSelectTab('products')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition ${
            currentTab === 'products'
              ? 'bg-[#FFF5F0] text-[#E96832] font-semibold'
              : 'text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4]'
          }`}
        >
          Products & Inventory
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition ${
            currentTab === 'orders'
              ? 'bg-[#FFF5F0] text-[#E96832] font-semibold'
              : 'text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4]'
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition ${
            currentTab === 'overview'
              ? 'bg-[#FFF5F0] text-[#E96832] font-semibold'
              : 'text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4]'
          }`}
        >
          Overview
        </button>
      </div>

      {/* Right: Primary Call to Action */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold text-white bg-[#E96832] hover:bg-[#D45722] active:bg-[#BE4A1B] shadow-sm transition shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create order</span>
        </button>
      </div>
    </header>
  );
};
