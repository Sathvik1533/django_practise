import React, { useState, useMemo } from 'react';
import { StoreProductCard } from '../../components/storefront/StoreProductCard';
import type { StorefrontProduct, FashionCategory } from '../../types/storefront';
import { Filter, ArrowUpDown, X, Sparkles } from 'lucide-react';

interface StoreListingPageProps {
  products: StorefrontProduct[];
  loading: boolean;
  selectedCategory: FashionCategory;
  onSelectCategory: (category: FashionCategory) => void;
  onOpenDetail: (product: StorefrontProduct) => void;
  onAddToCart: (product: StorefrontProduct, size: string, color: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
  cartProductIds: Set<number>;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

const CATEGORIES: { id: FashionCategory; label: string }[] = [
  { id: 'all', label: 'All Fashion Products' },
  { id: 'women', label: 'Women Ethnic & Western' },
  { id: 'men', label: 'Men Casual & Denim' },
  { id: 'kids', label: 'Kids Junior Collection' },
  { id: 'footwear', label: 'Shoes & Footwear' },
  { id: 'accessories', label: 'Bags & Accessories' },
];

export const StoreListingPage: React.FC<StoreListingPageProps> = ({
  products,
  loading,
  selectedCategory,
  onSelectCategory,
  onOpenDetail,
  onAddToCart,
  searchQuery,
  onClearSearch,
  cartProductIds,
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Stock availability filter
    if (inStockOnly) {
      result = result.filter((p) => p.available_quantity > 0);
    }

    // Sort order
    if (sortOption === 'price-asc') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortOption === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, selectedCategory, searchQuery, inStockOnly, sortOption]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E2] pb-4">
        <div>
          <div className="text-xs text-[#71717A] mb-1">
            <span>Home</span> <span className="mx-1">/</span>
            <span className="capitalize">{selectedCategory === 'all' ? 'All Products' : selectedCategory}</span>
            {searchQuery && (
              <>
                <span className="mx-1">/</span>
                <span className="text-[#E96832]">Search: &ldquo;{searchQuery}&rdquo;</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#242424] tracking-tight flex items-center gap-2">
            <span>Indian Fashion Catalogue</span>
            <span className="text-xs font-normal text-[#71717A] bg-[#F4F4F5] px-2.5 py-0.5 rounded-full">
              {filteredProducts.length} items
            </span>
          </h1>
        </div>

        {/* Sort & Mobile Filter Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-[#E5E5E2] rounded-lg"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-[#E5E5E2] rounded-lg px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A]" />
            <label htmlFor="sort-select" className="text-[#71717A] whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent font-medium text-[#242424] outline-none cursor-pointer"
            >
              <option value="featured">Featured Deals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Listing Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Filter Sidebar */}
        <aside
          className={`space-y-6 md:block ${
            mobileFilterOpen ? 'block' : 'hidden md:block'
          } bg-white md:bg-transparent p-4 md:p-0 rounded-xl border md:border-none border-[#E5E5E2]`}
        >
          {/* Active Search Filter Tag */}
          {searchQuery && (
            <div className="p-3 bg-[#E96832]/5 border border-[#E96832]/20 rounded-lg flex items-center justify-between">
              <span className="text-xs font-medium text-[#242424] truncate">
                Query: <strong>{searchQuery}</strong>
              </span>
              <button
                type="button"
                onClick={onClearSearch}
                className="text-[#E96832] hover:text-[#D55722] p-1 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Department Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#242424] uppercase tracking-wider">
              Departments
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-[#E96832] text-white font-semibold'
                      : 'text-[#52525B] hover:bg-white hover:text-[#242424]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="pt-4 border-t border-[#E5E5E2] space-y-2">
            <h3 className="text-xs font-bold text-[#242424] uppercase tracking-wider">
              Availability
            </h3>
            <label className="flex items-center gap-2 text-xs text-[#52525B] cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#E96832] focus:ring-[#E96832] cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Backend Info Box */}
          <div className="pt-4 border-t border-[#E5E5E2]">
            <div className="p-3 bg-[#F8F7F4] border border-[#E5E5E2] rounded-lg text-xs space-y-1">
              <div className="font-semibold text-[#242424] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#E96832]" />
                Live API Integrity
              </div>
              <p className="text-[#71717A] text-[11px] leading-relaxed">
                Stock counts are informational and committed securely when placing orders through Django REST API.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#E5E5E2] rounded-xl p-4 animate-pulse h-80"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#E5E5E2] rounded-xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto text-[#71717A]">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#242424]">
                No matching fashion products found
              </h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Try clearing your search query or choosing another category from the sidebar.
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onClearSearch();
                  setInStockOnly(false);
                }}
                className="px-4 py-2 bg-[#E96832] text-white text-xs font-semibold rounded-lg hover:bg-[#D55722] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={onOpenDetail}
                  onAddToCart={onAddToCart}
                  inCart={cartProductIds.has(product.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
