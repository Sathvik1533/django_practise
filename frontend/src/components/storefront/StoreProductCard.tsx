import React from 'react';
import { Star, ShoppingBag, Check } from 'lucide-react';
import type { StorefrontProduct } from '../../types/storefront';

interface StoreProductCardProps {
  product: StorefrontProduct;
  onOpenDetail: (product: StorefrontProduct) => void;
  onAddToCart: (product: StorefrontProduct, size: string, color: string) => void;
  inCart?: boolean;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  onOpenDetail,
  onAddToCart,
  inCart = false,
}) => {
  const isOutOfStock = product.available_quantity <= 0;
  const isLowStock = product.available_quantity > 0 && product.available_quantity <= 8;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const defaultSize = product.sizes[0] || 'Standard';
    const defaultColor = product.colors[0]?.name || 'Standard';
    onAddToCart(product, defaultSize, defaultColor);
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group bg-white border border-[#E5E5E2] hover:border-[#D4D4D8] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] bg-[#F4F4F5] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.isBestSeller && (
            <span className="bg-[#242424] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-[#E96832] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
              New Season
            </span>
          )}
        </div>

        {/* Rating Floating Pill */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold text-[#242424] shadow-xs">
          <span>{product.rating}</span>
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[#A1A1AA] text-[10px]">({product.reviewCount})</span>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Department */}
          <div className="flex items-center justify-between text-[11px] text-[#71717A] uppercase tracking-wider mb-1">
            <span className="font-bold text-[#242424]">{product.brand}</span>
            <span className="text-[#A1A1AA]">{product.categoryLabel}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-medium text-[#242424] line-clamp-2 leading-snug group-hover:text-[#E96832] transition-colors mb-2">
            {product.name}
          </h3>

          {/* Price & Discount */}
          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-[#242424]">
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#A1A1AA] line-through">
                ₹{parseFloat(product.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
            {product.discountPercent && (
              <span className="text-xs font-semibold text-[#047857]">
                ({product.discountPercent}% OFF)
              </span>
            )}
          </div>

          {/* Real Inventory Status synced with Django backend */}
          <div className="text-[11px] mb-3">
            {isOutOfStock ? (
              <span className="text-[#DC2626] font-semibold">Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-[#D97706] font-semibold">
                Only {product.available_quantity} left in stock
              </span>
            ) : (
              <span className="text-[#047857] font-medium">
                In Stock ({product.available_quantity} units)
              </span>
            )}
          </div>
        </div>

        {/* Shopping Action */}
        <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed'
                : inCart
                ? 'bg-[#10B981]/15 text-[#047857] hover:bg-[#10B981]/25'
                : 'bg-[#E96832] hover:bg-[#D55722] text-white active:scale-95 shadow-xs'
            }`}
          >
            {isOutOfStock ? (
              'Unavailable'
            ) : inCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
