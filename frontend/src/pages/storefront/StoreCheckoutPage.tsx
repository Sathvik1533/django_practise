import React, { useState } from 'react';
import type { CartItem, CustomerShippingAddress } from '../../types/storefront';
import type { OrderCreateResponse, ApiError } from '../../types/api';
import { createOrder } from '../../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeft,
  Loader2,
  Lock,
  Layers,
} from 'lucide-react';

interface StoreCheckoutPageProps {
  items: CartItem[];
  onOrderSuccess: (order: OrderCreateResponse) => void;
  onBackToCart: () => void;
  onContinueShopping: () => void;
  onOpenOperations: () => void;
}

export const StoreCheckoutPage: React.FC<StoreCheckoutPageProps> = ({
  items,
  onOrderSuccess,
  onBackToCart,
  onContinueShopping,
  onOpenOperations,
}) => {
  const [address, setAddress] = useState<CustomerShippingAddress>({
    fullName: 'Rahul Sharma',
    phone: '9876543210',
    pincode: '400001',
    addressLine: 'Flat 402, Lotus Heights, MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('cod');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderCreateResponse | null>(null);

  const estimatedTotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    // Payload strict contract: { "items": [{ "product_id": number, "quantity": number }] }
    const payload = {
      items: items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    };

    try {
      const response = await createOrder(payload);
      setConfirmedOrder(response);
      onOrderSuccess(response);
    } catch (err: unknown) {
      setError(err as ApiError);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION STATE
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white border border-[#E5E5E2] rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/15 text-[#047857] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#047857] bg-[#10B981]/10 px-3 py-1 rounded-full">
              Order Confirmed &amp; Stock Reserved
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#242424]">
              Thank You for Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A]">
              Your order has been committed to the Django logistics backend via atomic transaction.
            </p>
          </div>

          {/* Committed Order Summary Box */}
          <div className="bg-[#F8F7F4] border border-[#E5E5E2] rounded-xl p-5 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
              <div>
                <span className="text-[#71717A]">Order Reference:</span>
                <span className="font-bold text-[#242424] ml-2 text-sm">
                  #{confirmedOrder.order_id}
                </span>
              </div>
              <div>
                <span className="text-[#71717A]">Status:</span>
                <span className="font-bold text-[#047857] uppercase ml-2 bg-[#10B981]/15 px-2 py-0.5 rounded">
                  {confirmedOrder.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
              <div>
                <span className="text-[#71717A]">Committed Backend Total:</span>
                <span className="font-extrabold text-base text-[#242424] ml-2">
                  ₹{parseFloat(confirmedOrder.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[11px] text-[#71717A]">
                Date: {new Date(confirmedOrder.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Items details */}
            <div className="space-y-2 pt-1">
              <span className="font-bold text-[#242424] block">Reserved Items:</span>
              <ul className="space-y-1.5 text-[#52525B]">
                {confirmedOrder.items.map((it) => {
                  const matchingItem = items.find((i) => i.product.id === it.product_id);
                  const itemName = matchingItem?.product.name || `Product #${it.product_id}`;
                  return (
                    <li
                      key={it.product_id}
                      className="flex items-center justify-between text-xs py-1 border-b border-[#F0EFEA] last:border-none"
                    >
                      <span>
                        {itemName} <strong className="text-[#242424]">× {it.quantity}</strong>
                      </span>
                      <span className="font-semibold text-[#242424]">
                        ₹{parseFloat(it.line_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Delivery address review */}
            <div className="pt-2 border-t border-[#E5E5E2] text-[11px] text-[#71717A]">
              <span className="font-semibold text-[#242424]">Delivering to: </span>
              {address.fullName}, {address.addressLine}, {address.city}, {address.state} - {address.pincode}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#E96832] hover:bg-[#D55722] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Continue Shopping
            </button>
            <button
              type="button"
              onClick={onOpenOperations}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#F8F7F4] hover:bg-[#EFEFEA] text-[#242424] border border-[#E5E5E2] text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#71717A]" />
              <span>Inspect in Warehouse Ops</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT FORM
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4">
        <div>
          <button
            type="button"
            onClick={onBackToCart}
            className="inline-flex items-center gap-1 text-xs text-[#52525B] hover:text-[#242424] mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </button>
          <h1 className="text-2xl font-bold text-[#242424] tracking-tight">
            Checkout &amp; Place Order
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Shipping Address & Payment (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Delivery Address Card */}
          <div className="bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F0EFEA] pb-3">
              <Truck className="w-4 h-4 text-[#E96832]" />
              <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider">
                1. Delivery Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Mobile Number (10 digits)
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Street Address / Flat / Building
                </label>
                <input
                  type="text"
                  required
                  value={address.addressLine}
                  onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E2] rounded-lg outline-none focus:border-[#E96832]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F0EFEA] pb-3">
              <Lock className="w-4 h-4 text-[#E96832]" />
              <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider">
                2. Payment Method
              </h2>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors border-[#E96832] bg-[#E96832]/5">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="w-4 h-4 text-[#E96832]"
                />
                <div>
                  <div className="text-xs font-bold text-[#242424]">
                    Cash on Delivery (COD) / Pay on Arrival
                  </div>
                  <div className="text-[11px] text-[#71717A]">
                    Pay cash or UPI to delivery executive at your doorstep
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#E5E5E2] rounded-lg cursor-pointer hover:bg-[#F8F7F4] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="w-4 h-4 text-[#E96832]"
                />
                <div>
                  <div className="text-xs font-bold text-[#242424]">UPI Instant (GPay / PhonePe / Paytm)</div>
                  <div className="text-[11px] text-[#71717A]">Fast payment via QR or VPA</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#E5E5E2] rounded-lg cursor-pointer hover:bg-[#F8F7F4] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-4 h-4 text-[#E96832]"
                />
                <div>
                  <div className="text-xs font-bold text-[#242424]">Credit / Debit Card (Visa, RuPay, Mastercard)</div>
                  <div className="text-[11px] text-[#71717A]">Safe 256-bit SSL encrypted transaction</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Submission (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#242424] uppercase tracking-wider border-b border-[#F0EFEA] pb-3">
              Order Items Summary
            </h3>

            {/* Items preview list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.product.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-[#242424] truncate">
                      {it.product.name}
                    </div>
                    <div className="text-[10px] text-[#71717A]">
                      Qty: {it.quantity} • Size: {it.selectedSize}
                    </div>
                  </div>
                  <div className="font-bold text-[#242424] shrink-0">
                    ₹{(parseFloat(it.product.price) * it.quantity).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F0EFEA] pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#52525B]">
                <span>Items Subtotal</span>
                <span>₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-[#52525B]">
                <span>Delivery</span>
                <span className="text-[#047857] font-semibold">FREE</span>
              </div>
              <div className="border-t border-[#F0EFEA] pt-2 flex items-center justify-between text-sm font-bold text-[#242424]">
                <span>Estimated Total</span>
                <span className="text-[#E96832]">
                  ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-[#A1A1AA] pt-1">
                *Final authoritative total is calculated and locked by the Django backend upon order submission.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Order Failed:</div>
                  <p>{error.message}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98 cursor-pointer ${
                submitting
                  ? 'bg-[#E5E5E2] text-[#71717A] cursor-not-allowed'
                  : 'bg-[#E96832] hover:bg-[#D55722] text-white'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E96832]" />
                  <span>Committing Transaction...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Your Order</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#71717A] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Atomic MySQL Transaction • Safe Order Lock</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
