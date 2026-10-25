import React from 'react';
import type { CartItem } from '../../types/storefront';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react';

interface StoreCartPageProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
}

export const StoreCartPage: React.FC<StoreCartPageProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceedToCheckout,
}) => {
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const freeDeliveryThreshold = 499;
  const deliveryFee = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : 70;
  const totalPayable = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#F8F7F4] border border-[#E5E5E2] flex items-center justify-center mx-auto text-[#71717A]">
          <ShoppingBag className="w-8 h-8 text-[#A1A1AA]" />
        </div>
        <h2 className="text-xl font-bold text-[#242424]">Your Shopping Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-[#71717A] max-w-sm mx-auto">
          Explore our collection of festive kurtas, designer denim, footwear and accessories.
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="bg-[#E96832] hover:bg-[#D55722] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          Browse Fashion Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4">
        <div>
          <button
            type="button"
            onClick={onContinueShopping}
            className="inline-flex items-center gap-1 text-xs text-[#52525B] hover:text-[#242424] mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-2xl font-bold text-[#242424] tracking-tight">
            Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const lineTotal = parseFloat(item.product.price) * item.quantity;
            const maxQty = item.product.available_quantity;

            return (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                className="bg-white border border-[#E5E5E2] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                {/* Product Image and Meta */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-20 h-24 rounded-lg bg-[#F4F4F5] overflow-hidden shrink-0 border border-[#E5E5E2]">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                      {item.product.brand}
                    </div>
                    <h3 className="text-sm font-semibold text-[#242424] truncate max-w-xs sm:max-w-md">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#52525B]">
                      <span>Size: <strong>{item.selectedSize}</strong></span>
                      <span>•</span>
                      <span>Colour: <strong>{item.selectedColor}</strong></span>
                    </div>
                    <div className="text-xs font-bold text-[#242424]">
                      ₹{parseFloat(item.product.price).toLocaleString('en-IN')}{' '}
                      <span className="text-[11px] font-normal text-[#71717A]">per unit</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-none border-[#F0EFEA]">
                  <div className="flex items-center border border-[#E5E5E2] rounded-lg overflow-hidden bg-[#F8F7F4]">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs font-bold text-[#242424] hover:bg-[#EFEFEA] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-semibold text-[#242424] min-w-[28px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= maxQty}
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-xs font-bold text-[#242424] hover:bg-[#EFEFEA] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-[#242424]">
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-[#71717A]">
                        ({item.quantity} × ₹{parseFloat(item.product.price).toLocaleString('en-IN')})
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-1.5 text-[#71717A] hover:text-[#DC2626] rounded-md hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#242424] uppercase tracking-wider border-b border-[#F0EFEA] pb-3">
              Price Details
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#52525B]">
                <span>Total Items</span>
                <span className="font-medium text-[#242424]">
                  {items.reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>

              <div className="flex items-center justify-between text-[#52525B]">
                <span>Bag MRP Subtotal</span>
                <span className="font-medium text-[#242424]">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#52525B]">
                <span>Delivery Charges</span>
                {deliveryFee === 0 ? (
                  <span className="font-semibold text-[#047857]">FREE</span>
                ) : (
                  <span className="font-medium text-[#242424]">₹{deliveryFee.toFixed(2)}</span>
                )}
              </div>

              {deliveryFee > 0 && (
                <div className="p-2 bg-[#F8F7F4] rounded text-[11px] text-[#71717A]">
                  Add items worth ₹{(freeDeliveryThreshold - subtotal).toFixed(2)} more for Free Delivery.
                </div>
              )}

              <div className="border-t border-[#F0EFEA] pt-3 flex items-center justify-between text-sm font-bold text-[#242424]">
                <span>Total Payable</span>
                <span className="text-[#E96832]">
                  ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full bg-[#E96832] hover:bg-[#D55722] text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#71717A] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Safe and Secure Payments • 100% Authentic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
