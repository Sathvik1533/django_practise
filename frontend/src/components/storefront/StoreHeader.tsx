import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  Menu,
  X,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type { FashionCategory } from '../../types/storefront';

interface StoreHeaderProps {
  currentCategory: FashionCategory;
  onSelectCategory: (category: FashionCategory) => void;
  cartCount: number;
  onOpenCart: () => void;
  onNavigateHome: () => void;
  onNavigateProducts: () => void;
  onOpenOperations: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
}

const CATEGORIES: { id: FashionCategory; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'kids', label: 'Kids' },
  { id: 'footwear', label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' },
];

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  currentCategory,
  onSelectCategory,
  cartCount,
  onOpenCart,
  onNavigateHome,
  onNavigateProducts,
  onOpenOperations,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5E2] shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-[#242424] text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#E96832]" />
        <span>
          Festive Super Sale is Live! Enjoy up to <strong>70% Off</strong> on Indian Ethnic & Western Wear
        </span>
        <span className="hidden sm:inline text-[#A1A1AA]">• Free Shipping above ₹499</span>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-[#242424] hover:bg-[#F8F7F4] rounded-md"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#E96832] flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-xs">
            A
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-[#242424] flex items-center gap-1 font-serif">
              AURA <span className="text-[#E96832] font-sans text-xs tracking-wider uppercase font-semibold">Store</span>
            </div>
            <p className="text-[10px] text-[#71717A] hidden sm:block -mt-1 tracking-wide">
              Fashion & Lifestyle Storefront
            </p>
          </div>
        </button>

        {/* Deliver To Selector (Amazon/Flipkart convention) */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#52525B] px-2 py-1 rounded hover:bg-[#F8F7F4] cursor-pointer">
          <MapPin className="w-4 h-4 text-[#E96832]" />
          <div>
            <div className="text-[10px] text-[#A1A1AA]">Deliver to</div>
            <div className="font-semibold text-[#242424]">Mumbai 400001</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <div className="flex items-center border-2 border-[#E5E5E2] focus-within:border-[#E96832] rounded-lg overflow-hidden bg-[#F8F7F4]">
            <input
              type="text"
              placeholder="Search for Kurtas, Denim, Shirts, Shoes, Bags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full py-2 px-3 text-sm bg-transparent text-[#242424] placeholder-[#A1A1AA] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="px-2 text-xs text-[#71717A] hover:text-[#242424]"
                title="Clear search"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onSearchSubmit}
              className="bg-[#E96832] hover:bg-[#D55722] text-white px-4 py-2 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Operations Dashboard Toggle Link */}
          <button
            type="button"
            onClick={onOpenOperations}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#52525B] hover:text-[#242424] bg-[#F8F7F4] hover:bg-[#EFEFEA] border border-[#E5E5E2] rounded-md transition-colors cursor-pointer"
            title="Switch to Warehouse Operations Dashboard"
          >
            <Layers className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Warehouse Ops</span>
          </button>

          {/* Account Link */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#242424] px-2 py-1.5 rounded cursor-pointer"
          >
            <User className="w-4 h-4 text-[#71717A]" />
            <div className="text-left">
              <span className="block text-[10px] text-[#A1A1AA]">Hello, Guest</span>
              <span className="font-semibold text-[#242424]">Account</span>
            </div>
          </button>

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 bg-[#F8F7F4] hover:bg-[#EFEFEA] text-[#242424] px-3 py-2 rounded-lg border border-[#E5E5E2] font-semibold text-sm transition-colors cursor-pointer relative"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-[#242424]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E96832] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
          </button>
        </div>
      </div>

      {/* Secondary Department Strip */}
      <nav className="bg-white border-t border-[#F0EFEA] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-4 overflow-x-auto py-2 text-xs sm:text-sm font-medium text-[#52525B] no-scrollbar">
          <button
            type="button"
            onClick={onNavigateProducts}
            className="flex items-center gap-1 px-3 py-1 text-[#242424] font-semibold hover:text-[#E96832] cursor-pointer"
          >
            All Products
            <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
          </button>
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigateProducts();
              }}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                currentCategory === cat.id
                  ? 'bg-[#E96832]/10 text-[#E96832] font-semibold'
                  : 'hover:text-[#242424] hover:bg-[#F8F7F4]'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pl-4 text-xs">
            <span className="bg-[#10B981]/15 text-[#047857] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
              ● Live Django Sync
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E5E2] bg-white p-4 space-y-3">
          <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
            Departments
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigateProducts();
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 text-sm rounded-md ${
                  currentCategory === cat.id
                    ? 'bg-[#E96832] text-white font-medium'
                    : 'bg-[#F8F7F4] text-[#242424]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E5E5E2] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onOpenOperations();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-[#F8F7F4] border border-[#E5E5E2] rounded-md text-[#242424]"
            >
              <Layers className="w-4 h-4 text-[#71717A]" />
              Warehouse Operations Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
