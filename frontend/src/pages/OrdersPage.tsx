import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Clock,
  Calendar,
  Hash,
  Boxes,
  Code2,
} from 'lucide-react';
import type { Product, OrderCreateRequest, OrderCreateResponse, ApiError } from '../types/api';
import { createOrder } from '../services/api';

interface OrdersPageProps {
  products: Product[];
  productsLoading: boolean;
  onRefreshProducts: () => void;
}

interface DraftLineItem {
  id: string; // local client key
  productId: number | '';
  quantity: number;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  products,
  productsLoading,
  onRefreshProducts,
}) => {
  // Line items state in draft
  const [items, setItems] = useState<DraftLineItem[]>([
    { id: 'item-1', productId: products[0]?.id || '', quantity: 1 },
  ]);

  // Submission & Confirmation state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderCreateResponse | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  // Available products map
  const productMap = new Map<number, Product>(products.map((p) => [p.id, p]));

  // Add new item row
  const handleAddItem = () => {
    // Pick first unused product if available
    const usedIds = new Set(items.map((i) => i.productId));
    const nextProduct = products.find((p) => !usedIds.has(p.id)) || products[0];

    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: nextProduct ? nextProduct.id : '',
        quantity: 1,
      },
    ]);
  };

  // Remove item row
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item field
  const handleUpdateItem = (
    id: string,
    field: 'productId' | 'quantity',
    value: number | ''
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'productId') {
            return { ...item, productId: value, quantity: 1 };
          }
          if (field === 'quantity') {
            return { ...item, quantity: typeof value === 'number' ? Math.max(1, value) : 1 };
          }
        }
        return item;
      })
    );
  };

  // Client validation
  const validationErrors: string[] = [];
  const selectedProductIds = items
    .map((i) => i.productId)
    .filter((id): id is number => typeof id === 'number' && id > 0);

  if (selectedProductIds.length === 0) {
    validationErrors.push('Please select at least one valid product.');
  }

  // Check duplicates
  const hasDuplicates = new Set(selectedProductIds).size !== selectedProductIds.length;
  if (hasDuplicates) {
    validationErrors.push('Each product can appear only once in the order.');
  }

  // Check positive quantities
  for (const item of items) {
    if (typeof item.productId === 'number' && item.quantity <= 0) {
      validationErrors.push(`Quantity for product #${item.productId} must be greater than zero.`);
    }
    const product = typeof item.productId === 'number' ? productMap.get(item.productId) : null;
    if (product && item.quantity > product.available_quantity) {
      validationErrors.push(
        `Quantity for "${product.name}" (${item.quantity}) exceeds available warehouse stock (${product.available_quantity}).`
      );
    }
  }

  const isValid = validationErrors.length === 0 && items.length > 0;

  // Build the strict backend payload
  const backendPayload: OrderCreateRequest = {
    items: items
      .filter((i): i is DraftLineItem & { productId: number } => typeof i.productId === 'number' && i.productId > 0)
      .map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
      })),
  };

  // Calculate preliminary estimate for user feedback
  let preliminaryTotal = 0;
  for (const item of items) {
    if (typeof item.productId === 'number') {
      const product = productMap.get(item.productId);
      if (product) {
        preliminaryTotal += parseFloat(product.price) * item.quantity;
      }
    }
  }

  // Submit to Django POST /api/orders/
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createOrder(backendPayload);
      setConfirmedOrder(response);
      // Immediately refresh inventory stock figures across app
      onRefreshProducts();
    } catch (err: unknown) {
      setSubmitError(err as ApiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmedOrder(null);
    setSubmitError(null);
    setItems([
      { id: `item-${Date.now()}`, productId: products[0]?.id || '', quantity: 1 },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-400" />
            <span>Order Dispatch & Stock Reservation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Primary Demo Slice: Submits directly to <code className="text-indigo-300 font-mono">POST /api/orders/</code> with MySQL row-level locking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition font-mono"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{showJsonPreview ? 'Hide Payload' : 'View API Payload'}</span>
          </button>
        </div>
      </div>

      {/* Confirmed Order State (Shown after HTTP 201 Created) */}
      {confirmedOrder ? (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-start space-x-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  HTTP 201 Created • Transaction Committed
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Order Successfully Created & Stock Reserved
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inventory was locked via <code className="text-slate-300 font-mono">SELECT ... FOR UPDATE</code> and stock was safely incremented.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-bold text-white">Order #{confirmedOrder.order_id}</span>
              </div>
            </div>
          </div>

          {/* Meta specs bar */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Status:</span>
              <span className="capitalize font-mono font-bold text-emerald-400">
                {confirmedOrder.status}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="h-4 w-4 text-sky-400" />
              <span>Created At:</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {new Date(confirmedOrder.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-300 font-medium">Authoritative DB Snapshot</span>
            </div>
          </div>

          {/* Line items response table */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Itemized Order Record (from Django Response)
              </span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Product ID</th>
                    <th className="py-3 px-4 font-medium text-center">Quantity</th>
                    <th className="py-3 px-4 font-medium text-right">Unit Price (Snapshot)</th>
                    <th className="py-3 px-4 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {confirmedOrder.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-3 px-4 text-slate-200">
                        Product #{item.product_id}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-200">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        ${parseFloat(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/60 border-t border-slate-800 text-xs">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4 text-right font-medium text-slate-300">
                      Authoritative Order Total:
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono text-sm">
                      ${parseFloat(confirmedOrder.total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Create Another Order</span>
            </button>
          </div>
        </div>
      ) : (
        /* Order Creation Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Item Builder */}
          <div className="lg:col-span-2 space-y-4">
            {/* Real payload preview if toggled */}
            {showJsonPreview && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs">
                <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
                  <span>Exact Payload Transmitted to POST /api/orders/:</span>
                  <span className="text-emerald-400">application/json</span>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-indigo-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(backendPayload, null, 2)}
                </pre>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-bold text-white tracking-tight">
                  Line Items Selection
                </span>
                <span className="text-xs text-slate-400">
                  {items.length} {items.length === 1 ? 'line item' : 'line items'}
                </span>
              </div>

              {productsLoading ? (
                <div className="space-y-3 py-6">
                  <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Boxes className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <span>No products available from the backend catalogue yet.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const selectedProduct =
                      typeof item.productId === 'number'
                        ? productMap.get(item.productId)
                        : null;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
                      >
                        {/* Product Picker */}
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                            Product #{index + 1}:
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'productId',
                                e.target.value ? parseInt(e.target.value, 10) : ''
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="">Select a product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.available_quantity <= 0}>
                                {p.name} — ${parseFloat(p.price).toFixed(2)} ({p.available_quantity} available)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="w-full sm:w-36">
                          <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                            Quantity:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct?.available_quantity || 9999}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'quantity',
                                e.target.value ? parseInt(e.target.value, 10) : 1
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-white font-mono text-center focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Remove Action */}
                        <div className="flex items-end pt-5 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length === 1}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 disabled:opacity-20 transition"
                            title="Remove this item row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add item button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={products.length === 0}
                  className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Product Line</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Summary & Place Order Action */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Draft Order Summary
                </h3>
                <span className="text-[11px] text-slate-400">
                  Pre-flight validation check
                </span>
              </div>

              {/* Preliminary Total */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Products:</span>
                  <span className="font-mono text-white font-semibold">
                    {items.filter((i) => typeof i.productId === 'number' && i.productId > 0).length}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Units:</span>
                  <span className="font-mono text-white font-semibold">
                    {items.reduce((acc, i) => acc + (i.quantity || 0), 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-slate-300 font-medium">Estimated Total:</span>
                  <span className="text-lg font-bold font-mono text-white">
                    ${preliminaryTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Authoritative pricing notice */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 inline mr-1 -mt-0.5" />
                The frontend never calculates final receipts. Prices and availability are locked authoritatively by Django during transaction execution.
              </div>

              {/* Client Validation Warnings */}
              {validationErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                  <div className="flex items-center space-x-1 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Input Validation</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Backend Error Alert */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
                  <span className="font-semibold block flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="h-4 w-4" /> Backend Rejection (HTTP {submitError.status || 400})
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-95">
                    {submitError.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={!isValid || submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing Database Lock...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Order via Django API</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
