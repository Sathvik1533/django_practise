import React from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Sparkles, Lock } from 'lucide-react';

interface HeroBannerProps {
  onShopNow: () => void;
  onExploreCategory: (category: 'women' | 'men' | 'footwear') => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, onExploreCategory }) => {
  return (
    <div className="space-y-4">
      {/* Main Campaign Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#44403C] text-white shadow-sm">
        {/* Subtle warm glow background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E96832]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center p-6 sm:p-10 lg:p-12 gap-8">
          {/* Left Text Column */}
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E96832] text-white text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Festive Season 2026
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white font-serif">
              Timeless Indian Elegance &amp; Modern Urban Style
            </h1>

            <p className="text-sm sm:text-base text-[#D6D3D1] max-w-xl leading-relaxed">
              Discover hand-embroidered Anarkali suits, washed denim essentials, athletic footwear, and signature leather accessories delivered straight to your doorstep.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onShopNow}
                className="bg-[#E96832] hover:bg-[#D55722] text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <span>Shop All Fashion</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onExploreCategory('women')}
                className="bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base px-5 py-3 rounded-lg border border-white/20 transition-colors cursor-pointer"
              >
                Ethnic Wear (Flat 50% Off)
              </button>
            </div>

            <div className="pt-2 flex items-center gap-6 text-xs text-[#A8A29E]">
              <div>
                <span className="font-bold text-white text-base">500+</span>
                <span className="block text-[11px]">Designer Styles</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="font-bold text-white text-base">4.7 ★</span>
                <span className="block text-[11px]">Customer Rating</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="font-bold text-white text-base">24 Hr</span>
                <span className="block text-[11px]">Express Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image Showcase Column */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-xl border-2 border-white/20 bg-[#292524] relative">
                <img
                  src="/images/products/anouk-kurta-1.jpg"
                  alt="Indian Ethnic Festive Kurta Set"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== '/images/placeholder-product.svg') {
                      target.src = '/images/placeholder-product.svg';
                    }
                  }}
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-white/95 backdrop-blur-md rounded-lg text-[#242424] flex items-center justify-between shadow-md">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#E96832]">Trending Now</div>
                    <div className="text-xs font-bold truncate">Anouk Floral Anarkali Set</div>
                    <div className="text-xs font-semibold text-[#18181B]">
                      ₹1,499 <span className="line-through text-[#71717A] text-[10px]">₹2,999</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#E96832] text-white font-bold px-2 py-1 rounded">
                    50% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Convenience Value Proposition Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E5E2] rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#E96832]/10 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-[#E96832]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#242424]">Fast Logistics</div>
            <div className="text-[11px] text-[#71717A]">Free shipping above ₹499</div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E2] rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#E96832]/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-[#E96832]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#242424]">7-Day Returns</div>
            <div className="text-[11px] text-[#71717A]">Instant door pickup</div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E2] rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#E96832]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#E96832]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#242424]">100% Genuine</div>
            <div className="text-[11px] text-[#71717A]">Direct brand sourced</div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E2] rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#E96832]/10 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[#E96832]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#242424]">Secure Checkout</div>
            <div className="text-[11px] text-[#71717A]">256-Bit SSL Protection</div>
          </div>
        </div>
      </div>
    </div>
  );
};
