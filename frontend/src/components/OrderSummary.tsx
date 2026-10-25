import React from 'react';
import { ShoppingBag, ArrowRight, Loader2, AlertCircle, Trash2, Info } from 'lucide-react';
import type { Product, ApiError } from '../types/api';

interface OrderSummaryProps {
  products: Product[];
  cart: Record<number, number>;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  submitting: boolean;
  submitError: ApiError | null;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  products,
  cart,
  onClearCart,
  onSubmitOrder,
  submitting,
  submitError,
}) => {
  // Find cart items matching available products
  const selectedEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const totalItemCount = selectedEntries.reduce((acc, [, qty]) => acc + qty, 0);

  // Compute estimate if product details are available
  const productMap = new Map<number, Product>(products.map((p) => [p.id, p]));
  let estimatedTotal = 0;
  let hasPriceData = false;

  const cartItems = selectedEntries.map(([idStr, quantity]) => {
    const id = parseInt(idStr, 10);
    const product = productMap.get(id);
    const price = product ? parseFloat(product.price) : 0;
    if (product) {
      hasPriceData = true;
      estimatedTotal += price * quantity;
    }
    return {
      productId: id,
      quantity,
      product,
      lineTotal: price * quantity,
    };
  });

  const isEmpty = cartItems.length === 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Order Summary</h2>
              <span className="text-[11px] text-slate-400">
                {totalItemCount} {totalItemCount === 1 ? 'unit' : 'units'} selected
              </span>
            </div>
          </div>

          {!isEmpty && (
            <button
              type="button"
              onClick={onClearCart}
              disabled={submitting}
              className="text-xs text-slate-400 hover:text-rose-400 transition flex items-center gap-1 disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Selected Items List */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          {isEmpty ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Your order queue is currently empty.
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-medium text-slate-200">
                    {item.product ? item.product.name : `Product #${item.productId}`}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Qty: {item.quantity} {item.product && `@ $${parseFloat(item.product.price).toFixed(2)}`}
                  </div>
                </div>

                <div className="text-right">
                  {item.product ? (
                    <span className="font-mono font-semibold text-white">
                      ${item.lineTotal.toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-400">
                      ID #{item.productId}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notice on Price Snapshot */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start space-x-2 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
          <span>
            The backend transaction is the authoritative source of truth. Final prices, line totals, and stock reservations are computed by Django during <code className="text-slate-300">POST /api/orders/</code>.
          </span>
        </div>

        {/* Submit Error Alert */}
        {submitError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Order Placement Error</span>
              <span className="text-[11px] opacity-90">{submitError.message}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800">
        {hasPriceData && (
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-slate-400">Estimated Total:</span>
            <span className="text-xl font-bold font-mono text-white">
              ${estimatedTotal.toFixed(2)}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={isEmpty || submitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting Order Transaction...</span>
            </>
          ) : (
            <>
              <span>Place Order via Django API</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
