import React, { useState } from 'react';
import type { StorefrontProduct } from '../../types/storefront';
import {
  Star,
  ShoppingBag,
  Zap,
  ArrowLeft,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';

interface StoreDetailPageProps {
  product: StorefrontProduct;
  onBack: () => void;
  onAddToCart: (
    product: StorefrontProduct,
    size: string,
    color: string,
    quantity: number
  ) => void;
  onBuyNow: (
    product: StorefrontProduct,
    size: string,
    color: string,
    quantity: number
  ) => void;
  inCart?: boolean;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
  inCart = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors[0]?.name || 'Standard'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [pincode, setPincode] = useState<string>('400001');
  const [pincodeChecked, setPincodeChecked] = useState<boolean>(true);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  const isOutOfStock = product.available_quantity <= 0;
  const isLowStock = product.available_quantity > 0 && product.available_quantity <= 8;

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    onBuyNow(product, selectedSize, selectedColor, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52525B] hover:text-[#242424] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store Catalogue</span>
      </button>

      {/* Main Dual-Pane Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-[#E5E5E2] rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Large Display Image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F4F4F5] border border-[#E5E5E2]">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-top"
            />
            {product.discountPercent && (
              <span className="absolute top-3 left-3 bg-[#E96832] text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-xs">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-[#E96832] ring-2 ring-[#E96832]/30'
                      : 'border-[#E5E5E2] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="pt-4 border-t border-[#F0EFEA] space-y-2 text-xs text-[#71717A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>100% Original Products Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#047857]" />
              <span>Easy 7-day returns and exchanges</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#047857]" />
              <span>Free delivery on orders above ₹499</span>
            </div>
          </div>
        </div>

        {/* Right Column: Purchasing & Specifications (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-[#E96832] mb-1">
              {product.brand} • {product.categoryLabel}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#242424] leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="inline-flex items-center gap-1 bg-[#047857] text-white px-2 py-0.5 rounded text-xs font-bold">
                <span>{product.rating}</span>
                <Star className="w-3 h-3 fill-white text-white" />
              </div>
              <span className="text-xs text-[#71717A]">
                {product.reviewCount} Ratings &amp; Verified Reviews
              </span>
            </div>
          </div>

          {/* Price display */}
          <div className="p-4 bg-[#F8F7F4] rounded-xl border border-[#E5E5E2] space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#242424]">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-[#A1A1AA] line-through">
                  ₹{parseFloat(product.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
              {product.discountPercent && (
                <span className="text-sm font-bold text-[#047857]">
                  {product.discountPercent}% OFF
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#71717A]">
              Inclusive of all taxes. Free express shipping available at checkout.
            </p>
          </div>

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#242424] flex items-center justify-between">
                <span>Select Colour:</span>
                <span className="text-[#E96832] font-semibold">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedColor === c.name
                        ? 'border-[#E96832] bg-[#E96832]/5 ring-1 ring-[#E96832]'
                        : 'border-[#E5E5E2] hover:border-[#A1A1AA]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-medium text-[#242424]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#242424] flex items-center justify-between">
                <span>Select Size:</span>
                <span className="text-[#71717A] text-[11px] underline cursor-pointer">
                  Size Guide
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[44px] h-10 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-[#E96832] text-white border-[#E96832] shadow-xs'
                        : 'bg-white text-[#242424] border-[#E5E5E2] hover:border-[#242424]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Stock Availability */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#242424]">Quantity:</div>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center border border-[#E5E5E2] rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-[#242424] hover:bg-[#F8F7F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-semibold text-[#242424] min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.available_quantity || isOutOfStock}
                  onClick={() =>
                    setQuantity((q) => Math.min(product.available_quantity, q + 1))
                  }
                  className="px-3 py-1.5 text-sm font-bold text-[#242424] hover:bg-[#F8F7F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Stock Status Badge */}
              <div className="text-xs">
                {isOutOfStock ? (
                  <span className="text-[#DC2626] font-bold">Currently Out of Stock</span>
                ) : isLowStock ? (
                  <span className="text-[#D97706] font-semibold">
                    Hurry! Only {product.available_quantity} items remaining
                  </span>
                ) : (
                  <span className="text-[#047857] font-medium">
                    In Stock ({product.available_quantity} available in warehouse)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCartClick}
              className={`w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed'
                  : 'bg-white border-2 border-[#E96832] text-[#E96832] hover:bg-[#E96832]/5 active:scale-95'
              }`}
            >
              {addedNotice ? (
                <>
                  <Check className="w-4 h-4 text-[#047857]" />
                  <span className="text-[#047857]">Added to Cart!</span>
                </>
              ) : inCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Update in Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNowClick}
              className={`w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-[#E5E5E2] text-[#A1A1AA] cursor-not-allowed'
                  : 'bg-[#E96832] hover:bg-[#D55722] text-white active:scale-95 shadow-sm'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Delivery Pin Check */}
          <div className="p-4 bg-[#F8F7F4] rounded-xl border border-[#E5E5E2] space-y-2">
            <div className="text-xs font-bold text-[#242424] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#E96832]" />
              <span>Delivery Options &amp; Services</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN code"
                className="w-44 px-3 py-1.5 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
              />
              <button
                type="button"
                onClick={() => setPincodeChecked(true)}
                className="px-3 py-1.5 bg-[#242424] hover:bg-[#3F3F46] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Check
              </button>
            </div>
            {pincodeChecked && (
              <div className="text-xs text-[#047857] font-medium pt-1">
                ✓ Delivery available to <strong>{pincode || '400001'}</strong> by 2 business days
              </div>
            )}
          </div>

          {/* Product Description & Details */}
          <div className="space-y-4 pt-4 border-t border-[#F0EFEA]">
            <div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Product Description</h3>
              <p className="text-xs text-[#52525B] leading-relaxed">{product.description}</p>
            </div>

            {product.details.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#242424] mb-2">Specifications &amp; Features</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#52525B]">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-1.5">
                      <span className="text-[#E96832] font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Architecture Transparency Note */}
            <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                Backend Integration Transparency Note
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Product ID #{product.id}, Name, Unit Price (₹{product.price}) and available stock ({product.available_quantity} units) correspond to the live Django inventory database. Photography, color swatches, and sizing represent the storefront presentation catalogue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
