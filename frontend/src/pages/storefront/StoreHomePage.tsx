import React from 'react';
import { HeroBanner } from '../../components/storefront/HeroBanner';
import { CategoryStrip } from '../../components/storefront/CategoryStrip';
import { StoreProductCard } from '../../components/storefront/StoreProductCard';
import type { StorefrontProduct, FashionCategory } from '../../types/storefront';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

interface StoreHomePageProps {
  products: StorefrontProduct[];
  loading: boolean;
  selectedCategory: FashionCategory;
  onSelectCategory: (category: FashionCategory) => void;
  onOpenDetail: (product: StorefrontProduct) => void;
  onAddToCart: (product: StorefrontProduct, size: string, color: string) => void;
  onViewAllProducts: () => void;
  cartProductIds: Set<number>;
}

export const StoreHomePage: React.FC<StoreHomePageProps> = ({
  products,
  loading,
  selectedCategory,
  onSelectCategory,
  onOpenDetail,
  onAddToCart,
  onViewAllProducts,
  cartProductIds,
}) => {
  const bestSellers = products.filter((p) => p.isBestSeller);
  const newArrivals = products.filter((p) => p.isNewArrival);

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* 1. Hero Campaign Banner */}
      <HeroBanner
        onShopNow={onViewAllProducts}
        onExploreCategory={(cat) => {
          onSelectCategory(cat);
          onViewAllProducts();
        }}
      />

      {/* 2. Department Category Strip */}
      <CategoryStrip
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          onSelectCategory(cat);
          onViewAllProducts();
        }}
      />

      {/* 3. Festive Super Deals Section (Best Sellers) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E96832]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#E96832]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#242424] tracking-tight">
                Festive Deals of the Day
              </h2>
              <p className="text-xs text-[#71717A]">
                Top rated customer favorites with instant dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewAllProducts}
            className="text-xs sm:text-sm font-semibold text-[#E96832] hover:text-[#D55722] flex items-center gap-1 cursor-pointer"
          >
            <span>See All Deals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E5E2] rounded-xl p-4 animate-pulse h-80"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.map((product) => (
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
      </section>

      {/* 4. Trending New Season Arrivals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#047857]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#242424] tracking-tight">
                Trending New Arrivals
              </h2>
              <p className="text-xs text-[#71717A]">
                Fresh seasonal designs in cotton, denim and athletic wear
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewAllProducts}
            className="text-xs sm:text-sm font-semibold text-[#E96832] hover:text-[#D55722] flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Full Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {newArrivals.map((product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              onOpenDetail={onOpenDetail}
              onAddToCart={onAddToCart}
              inCart={cartProductIds.has(product.id)}
            />
          ))}
        </div>
      </section>

      {/* 5. Indian Fashion Editorial Highlight Banner */}
      <div className="bg-[#FAF7F2] border border-[#EBE6DD] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E96832]">
            Authentic Craftsmanship
          </span>
          <h3 className="text-2xl font-bold text-[#242424] font-serif">
            Pure Indian Cottons & Handloom Weaves
          </h3>
          <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
            Every garment in our festive collection is manufactured by certified artisans and verified suppliers. Backed by end-to-end inventory tracking and atomic database order locks.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllProducts}
          className="bg-[#242424] hover:bg-[#3F3F46] text-white px-6 py-3 rounded-lg text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
        >
          Explore Ethnic Collection
        </button>
      </div>
    </div>
  );
};
