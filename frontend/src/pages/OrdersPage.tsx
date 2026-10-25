import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Calendar,
  Hash,
  Boxes,
} from 'lucide-react';
import type { Product, OrderCreateRequest, OrderCreateResponse, ApiError } from '../types/api';
import { createOrder } from '../services/api';

interface OrdersPageProps {
  products: Product[];
  productsLoading: boolean;
  onRefreshProducts: () => void;
}

interface DraftLineItem {
  id: string;
  productId: number | '';
  quantity: number;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  products,
  productsLoading,
  onRefreshProducts,
}) => {
  const [items, setItems] = useState<DraftLineItem[]>([
    { id: 'item-1', productId: products[0]?.id || '', quantity: 1 },
  ]);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderCreateResponse | null>(null);

  const productMap = new Map<number, Product>(products.map((p) => [p.id, p]));

  const handleAddItem = () => {
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

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

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

  const hasDuplicates = new Set(selectedProductIds).size !== selectedProductIds.length;
  if (hasDuplicates) {
    validationErrors.push('Each product can appear only once in the order.');
  }

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

  const backendPayload: OrderCreateRequest = {
    items: items
      .filter((i): i is DraftLineItem & { productId: number } => typeof i.productId === 'number' && i.productId > 0)
      .map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
      })),
  };

  let preliminaryTotal = 0;
  for (const item of items) {
    if (typeof item.productId === 'number') {
      const product = productMap.get(item.productId);
      if (product) {
        preliminaryTotal += parseFloat(product.price) * item.quantity;
      }
    }
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createOrder(backendPayload);
      setConfirmedOrder(response);
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
    <div className="space-y-5">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#E5E5E2]">
        <h1 className="text-xl font-bold text-[#242424] tracking-tight flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-[#E96832]" />
          <span>Order Dispatch & Stock Reservation</span>
        </h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Create customer orders and reserve warehouse inventory directly
        </p>
      </div>

      {/* Confirmed Order State (Shown after HTTP 201 Created) */}
      {confirmedOrder ? (
        <div className="bg-white rounded border border-[#E5E5E2] p-6 shadow-sm space-y-5">
          {/* Success Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E5E5E2]">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#15803D]">
                  Order Confirmed
                </span>
                <h2 className="text-lg font-bold text-[#242424] tracking-tight">
                  Order Successfully Created & Stock Reserved
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  The order has been registered and inventory allocated in the backend.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded bg-[#F8F7F4] border border-[#E5E5E2] text-[#242424] font-mono text-xs flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-[#E96832]" />
                <span className="font-bold">Order #{confirmedOrder.order_id}</span>
              </div>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded bg-[#F8F7F4] border border-[#E5E5E2] text-xs">
            <div className="flex items-center space-x-2 text-[#71717A]">
              <Clock className="h-4 w-4 text-[#71717A]" />
              <span>Status:</span>
              <span className="capitalize font-mono font-semibold text-[#15803D]">
                {confirmedOrder.status}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#71717A]">
              <Calendar className="h-4 w-4 text-[#71717A]" />
              <span>Created At:</span>
              <span className="font-mono text-[#242424] text-[11px]">
                {new Date(confirmedOrder.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E5E5E2] rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-[#71717A] border-b border-[#E5E5E2]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Product ID</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Quantity</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2] font-mono">
                {confirmedOrder.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F7F4]/50">
                    <td className="py-2.5 px-4 text-[#242424]">
                      Product #{item.product_id}
                    </td>
                    <td className="py-2.5 px-4 text-center text-[#242424]">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#71717A] tabular-nums">
                      ${parseFloat(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-[#242424] tabular-nums">
                      ${parseFloat(item.line_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#F8F7F4]/80 border-t border-[#E5E5E2] text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right font-semibold text-[#242424]">
                    Order Total:
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#242424] font-mono text-sm tabular-nums">
                    ${parseFloat(confirmedOrder.total).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded bg-[#E96832] hover:bg-[#D45722] text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Create Another Order</span>
            </button>
          </div>
        </div>
      ) : (
        /* Order Creation Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left: Line Items Builder */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded border border-[#E5E5E2] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
                <h2 className="text-sm font-bold text-[#242424] tracking-tight">
                  Line Items
                </h2>
                <span className="text-xs text-[#71717A]">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {productsLoading ? (
                <div className="space-y-3 py-4">
                  <div className="h-10 bg-[#F8F7F4] rounded animate-pulse" />
                  <div className="h-10 bg-[#F8F7F4] rounded animate-pulse" />
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#71717A]">
                  <Boxes className="h-8 w-8 text-[#A1A1AA] mx-auto mb-2" />
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
                        className="p-3 rounded border border-[#E5E5E2] bg-[#F8F7F4]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
                      >
                        {/* Product Picker */}
                        <div className="flex-1">
                          <label className="text-[11px] text-[#71717A] block mb-1 font-medium">
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
                            className="w-full px-3 py-1.5 rounded bg-white border border-[#E5E5E2] text-[#242424] focus:outline-none focus:border-[#E96832] font-medium"
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
                        <div className="w-full sm:w-32">
                          <label className="text-[11px] text-[#71717A] block mb-1 font-medium">
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
                            className="w-full px-3 py-1.5 rounded bg-white border border-[#E5E5E2] text-[#242424] font-mono text-center focus:outline-none focus:border-[#E96832]"
                          />
                        </div>

                        {/* Remove Action */}
                        <div className="flex items-end pt-5 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length === 1}
                            className="p-1.5 rounded text-[#71717A] hover:text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-20 transition"
                            title="Remove line item"
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
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={products.length === 0}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#E96832] hover:text-[#D45722] font-semibold px-2 py-1 rounded hover:bg-[#FFF5F0] transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another Product Line</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Draft Summary & Submit */}
          <div className="space-y-4">
            <div className="bg-white rounded border border-[#E5E5E2] p-5 shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#E5E5E2]">
                <h2 className="text-sm font-bold text-[#242424] tracking-tight">
                  Order Summary
                </h2>
                <span className="text-[11px] text-[#71717A]">
                  Review items before placement
                </span>
              </div>

              {/* Preliminary Total */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#71717A]">
                  <span>Selected Products:</span>
                  <span className="font-mono text-[#242424] font-semibold">
                    {items.filter((i) => typeof i.productId === 'number' && i.productId > 0).length}
                  </span>
                </div>
                <div className="flex justify-between text-[#71717A]">
                  <span>Total Units:</span>
                  <span className="font-mono text-[#242424] font-semibold">
                    {items.reduce((acc, i) => acc + (i.quantity || 0), 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E5E5E2] flex justify-between items-baseline">
                  <span className="text-[#242424] font-semibold">Estimated Total:</span>
                  <span className="text-base font-bold font-mono text-[#242424] tabular-nums">
                    ${preliminaryTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Client Validation Warnings */}
              {validationErrors.length > 0 && (
                <div className="p-3 rounded bg-[#FFFBEB] border border-[#FEF3C7] text-[#B45309] text-xs space-y-1">
                  <div className="flex items-center space-x-1 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#D97706]" />
                    <span>Order Validation</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contextual Backend Error Alert */}
              {submitError && (
                <div className="p-3 rounded bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs space-y-1">
                  <div className="flex items-center space-x-1 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
                    <span>Order Rejection (HTTP {submitError.status || 400})</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {submitError.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={!isValid || submitting}
                className="w-full py-2.5 px-4 rounded bg-[#E96832] hover:bg-[#D45722] active:bg-[#BE4A1B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-tight transition shadow-sm flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting order...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
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
