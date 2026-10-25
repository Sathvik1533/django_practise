import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShoppingBag, Search, CreditCard, CheckCircle } from 'lucide-react';

export const ShoppingGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#E5E5E2] rounded-xl bg-white overflow-hidden shadow-xs">
      {/* Discreet Accordion Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-medium text-[#52525B] hover:text-[#242424] hover:bg-[#F8F7F4] transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#E96832]" />
          <span>New to Aura Store? <strong>How It Works</strong> (4 Simple Steps)</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] text-[#71717A]">
          {isOpen ? 'Collapse Guide' : 'View Guide'}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Expandable Step-by-Step Shopping Workflow */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-[#F0EFEA] bg-[#FAF9F6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E5E5E2]">
            <div className="w-7 h-7 rounded-full bg-[#E96832]/10 text-[#E96832] font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-[#242424] flex items-center gap-1">
                <Search className="w-3 h-3 text-[#71717A]" />
                Browse &amp; Filter
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                Explore ethnic kurtas, denim, footwear, and accessories with instant department filtering.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E5E5E2]">
            <div className="w-7 h-7 rounded-full bg-[#E96832]/10 text-[#E96832] font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-[#242424] flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-[#71717A]" />
                Select &amp; Add
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                Choose your preferred size and color swatch, then add desired items to your shopping cart.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E5E5E2]">
            <div className="w-7 h-7 rounded-full bg-[#E96832]/10 text-[#E96832] font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-[#242424] flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#71717A]" />
                Review &amp; Checkout
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                Enter your shipping address, choose Cash on Delivery or UPI, and confirm item quantities.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E5E5E2]">
            <div className="w-7 h-7 rounded-full bg-[#10B981]/15 text-[#047857] font-bold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <div className="text-xs font-bold text-[#242424] flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#047857]" />
                Order Confirmation
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                Receive your unique server order reference number with immediate inventory reservation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
