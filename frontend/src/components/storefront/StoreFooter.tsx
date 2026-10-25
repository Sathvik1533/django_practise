import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Lock, Layers } from 'lucide-react';
import type { FashionCategory } from '../../types/storefront';

interface StoreFooterProps {
  onSelectCategory: (category: FashionCategory) => void;
  onOpenOperations: () => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({
  onSelectCategory,
  onOpenOperations,
}) => {
  return (
    <footer className="bg-white border-t border-[#E5E5E2] text-[#52525B] mt-12">
      {/* Top Value Banner */}
      <div className="border-b border-[#F0EFEA] py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <ShieldCheck className="w-6 h-6 text-[#E96832]" />
            <div>
              <div className="text-xs font-bold text-[#242424]">100% Genuine Products</div>
              <div className="text-[11px] text-[#71717A]">Sourced directly from verified brands</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <RotateCcw className="w-6 h-6 text-[#E96832]" />
            <div>
              <div className="text-xs font-bold text-[#242424]">Easy 7 Days Return</div>
              <div className="text-[11px] text-[#71717A]">Hassle-free reverse logistics</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <Truck className="w-6 h-6 text-[#E96832]" />
            <div>
              <div className="text-xs font-bold text-[#242424]">Fast Logistics Dispatch</div>
              <div className="text-[11px] text-[#71717A]">Tracked transit to your doorstep</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <Lock className="w-6 h-6 text-[#E96832]" />
            <div>
              <div className="text-xs font-bold text-[#242424]">100% Safe Payments</div>
              <div className="text-[11px] text-[#71717A]">256-Bit SSL protection &amp; COD</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-xs font-bold text-[#242424] uppercase tracking-wider mb-3">
              Online Shopping
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('women')}
                  className="hover:text-[#E96832] transition-colors cursor-pointer"
                >
                  Women Ethnic &amp; Western
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('men')}
                  className="hover:text-[#E96832] transition-colors cursor-pointer"
                >
                  Men Casuals &amp; Denim
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('kids')}
                  className="hover:text-[#E96832] transition-colors cursor-pointer"
                >
                  Kids Traditional &amp; Wear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('footwear')}
                  className="hover:text-[#E96832] transition-colors cursor-pointer"
                >
                  Footwear &amp; Trainers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('accessories')}
                  className="hover:text-[#E96832] transition-colors cursor-pointer"
                >
                  Watches &amp; Leather Bags
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#242424] uppercase tracking-wider mb-3">
              Customer Policies
            </h4>
            <ul className="space-y-2 text-xs text-[#71717A]">
              <li>Contact Support</li>
              <li>Frequently Asked Questions</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Grievance Redressal</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#242424] uppercase tracking-wider mb-3">
              About Aura Store
            </h4>
            <p className="text-xs text-[#71717A] leading-relaxed mb-3">
              Aura Store brings curated Indian ethnic couture, western denim essentials, footwear, and accessories directly to fashion shoppers with authentic quality assurance and instant doorstep delivery.
            </p>
            <div className="text-[11px] text-[#A1A1AA]">
              Free delivery on orders over ₹499 across all pin codes in India.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#242424] uppercase tracking-wider mb-3">
              Logistics &amp; Operations
            </h4>
            <p className="text-xs text-[#71717A] leading-relaxed mb-3">
              Internal fulfillment and inventory control console for warehouse administrators.
            </p>
            <button
              type="button"
              onClick={onOpenOperations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F8F7F4] hover:bg-[#EFEFEA] text-[#242424] border border-[#E5E5E2] rounded-md transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Warehouse Console →</span>
            </button>
          </div>
        </div>

        <div className="border-t border-[#F0EFEA] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>© 2026 Aura Fashion Storefront. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>100% Secure Checkout</span>
            <span>•</span>
            <span>Visa • Mastercard • RuPay • UPI • Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
