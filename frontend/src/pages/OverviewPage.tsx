import React from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import type { Product, ApiError, BackendHealthResponse } from '../types/api';
import type { NavTabId } from '../components/Sidebar';

interface OverviewPageProps {
  products: Product[];
  productsLoading: boolean;
  productsError: ApiError | null;
  health: BackendHealthResponse | null;
  onNavigate: (tab: NavTabId) => void;
  onRefreshProducts: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  products,
  productsLoading,
  productsError,
  onNavigate,
  onRefreshProducts,
}) => {
  const totalActiveSkus = products.length;
  const totalAvailableStock = products.reduce((acc, p) => acc + (p.available_quantity || 0), 0);
  const lowStockProducts = products.filter(
    (p) => p.available_quantity > 0 && p.available_quantity <= 5
  );
  const outOfStockProducts = products.filter((p) => p.available_quantity === 0);

  return (
    <div className="space-y-5">
      {/* Header with primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E5E2]">
        <div>
          <h1 className="text-xl font-bold text-[#242424] tracking-tight">
            Operations Overview
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Warehouse inventory status and order fulfillment activity
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onRefreshProducts}
            disabled={productsLoading}
            className="px-3 py-1.5 rounded bg-white border border-[#E5E5E2] hover:bg-[#F8F7F4] text-xs font-medium text-[#242424] transition"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#E96832] hover:bg-[#D45722] text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create order</span>
          </button>
        </div>
      </div>

      {/* Contextual API Error */}
      {productsError && (
        <div className="rounded border border-[#FEE2E2] bg-[#FEF2F2] p-4 flex items-start space-x-2.5 text-xs text-[#B91C1C]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" />
          <div>
            <span className="font-semibold block">Inventory connection error</span>
            <span>{productsError.message}</span>
          </div>
        </div>
      )}

      {/* Operational Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded bg-white border border-[#E5E5E2] shadow-sm">
          <div className="text-xs font-medium text-[#71717A]">Active SKUs</div>
          <div className="mt-2 text-2xl font-bold text-[#242424] font-mono tabular-nums">
            {productsLoading ? '—' : totalActiveSkus}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">Products in catalogue</div>
        </div>

        <div className="p-4 rounded bg-white border border-[#E5E5E2] shadow-sm">
          <div className="text-xs font-medium text-[#71717A]">Available Units</div>
          <div className="mt-2 text-2xl font-bold text-[#242424] font-mono tabular-nums">
            {productsLoading ? '—' : totalAvailableStock.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">Total warehouse stock</div>
        </div>

        <div className="p-4 rounded bg-white border border-[#E5E5E2] shadow-sm">
          <div className="text-xs font-medium text-[#B45309]">Low Stock Alert</div>
          <div className="mt-2 text-2xl font-bold text-[#B45309] font-mono tabular-nums">
            {productsLoading ? '—' : lowStockProducts.length}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">Items with ≤ 5 units</div>
        </div>

        <div className="p-4 rounded bg-white border border-[#E5E5E2] shadow-sm">
          <div className="text-xs font-medium text-[#B91C1C]">Out of Stock</div>
          <div className="mt-2 text-2xl font-bold text-[#B91C1C] font-mono tabular-nums">
            {productsLoading ? '—' : outOfStockProducts.length}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">Items requiring replenishment</div>
        </div>
      </div>

      {/* Critical Stock Attention Table */}
      <div className="bg-white rounded border border-[#E5E5E2] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#E5E5E2] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#242424] tracking-tight">
            Stock Attention Required
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="text-xs text-[#E96832] hover:text-[#D45722] font-semibold inline-flex items-center gap-1"
          >
            <span>View All Inventory</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#71717A]">
            All active inventory items have healthy stock levels (&gt; 5 units).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-[#71717A] border-b border-[#E5E5E2]">
                <tr>
                  <th className="py-2.5 px-4 w-20">ID</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Available Stock</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {[...outOfStockProducts, ...lowStockProducts].map((product) => (
                  <tr key={product.id} className="hover:bg-[#F8F7F4]/60">
                    <td className="py-2.5 px-4 font-mono text-[#71717A]">#{product.id}</td>
                    <td className="py-2.5 px-4 font-medium text-[#242424]">{product.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#242424]">
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#242424]">
                      {product.available_quantity}
                    </td>
                    <td className="py-2.5 px-4">
                      {product.available_quantity === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FEE2E2]">
                          Out of stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]">
                          Low stock ({product.available_quantity})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Quick Launcher */}
      <div className="p-4 rounded bg-white border border-[#E5E5E2] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="text-xs font-semibold text-[#242424]">Ready to dispatch a customer order?</h3>
          <p className="text-[11px] text-[#71717A]">
            Assemble multi-product line items with live stock limits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#E96832] hover:bg-[#D45722] text-white text-xs font-semibold shadow-sm transition"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Go to Orders</span>
        </button>
      </div>
    </div>
  );
};
