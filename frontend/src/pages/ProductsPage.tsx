import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  RefreshCw,
  Plus,
  Minus,
  AlertCircle,
  PackageSearch,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import type { Product, ApiError } from '../types/api';
import type { NavTabId } from '../components/Sidebar';

interface ProductsPageProps {
  products: Product[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  cart: Record<number, number>;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onNavigate: (tab: NavTabId) => void;
}

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  loading,
  error,
  onRetry,
  cart,
  onUpdateQuantity,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Client-side search and filters over real backend data
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toString() === searchQuery.trim();

      if (!matchesSearch) return false;

      if (stockFilter === 'in-stock') {
        return product.available_quantity > 0;
      }
      if (stockFilter === 'low-stock') {
        return product.available_quantity > 0 && product.available_quantity <= 5;
      }
      if (stockFilter === 'out-of-stock') {
        return product.available_quantity === 0;
      }

      return true;
    });
  }, [products, searchQuery, stockFilter]);

  const totalSelectedUnits = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E5E2]">
        <div>
          <h1 className="text-xl font-bold text-[#242424] tracking-tight flex items-center gap-2">
            <Boxes className="h-5 w-5 text-[#E96832]" />
            <span>Warehouse Inventory</span>
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Real inventory records fetched directly from the backend API
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white border border-[#E5E5E2] hover:bg-[#F8F7F4] text-xs font-medium text-[#242424] transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#E96832]' : 'text-[#71717A]'}`} />
            <span>Refresh</span>
          </button>

          {totalSelectedUnits > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#E96832] hover:bg-[#D45722] text-white text-xs font-semibold shadow-sm transition"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Review Order ({totalSelectedUnits})</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Contextual API Error State */}
      {error && (
        <div className="rounded border border-[#FEE2E2] bg-[#FEF2F2] p-4 flex items-start justify-between gap-3 text-xs text-[#B91C1C]">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <div>
              <span className="font-semibold block">Inventory connection error</span>
              <span className="text-[#7F1D1D] mt-0.5 block">{error.message}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded bg-white border border-[#FCA5A5] hover:bg-[#FEF2F2] text-[#B91C1C] font-semibold text-xs transition shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-white border border-[#E5E5E2] text-xs text-[#242424] placeholder-[#A1A1AA] focus:outline-none focus:border-[#E96832] transition"
          />
        </div>

        {/* Stock Filter Chips */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded border border-[#E5E5E2] text-xs overflow-x-auto max-w-full shrink-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'in-stock', label: 'In Stock' },
              { id: 'low-stock', label: 'Low Stock' },
              { id: 'out-of-stock', label: 'Out of Stock' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStockFilter(filter.id)}
              className={`px-2.5 py-1 rounded font-medium transition text-xs whitespace-nowrap ${
                stockFilter === filter.id
                  ? 'bg-[#FFF5F0] text-[#E96832] font-semibold border border-[#FCD8C8]'
                  : 'text-[#71717A] hover:text-[#242424] hover:bg-[#F8F7F4]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Loading, Empty, or Product Table */}
      {loading ? (
        <div className="bg-white rounded border border-[#E5E5E2] divide-y divide-[#E5E5E2]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 animate-pulse flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-[#F8F7F4] rounded" />
                <div className="h-3 w-48 bg-[#F8F7F4] rounded" />
              </div>
              <div className="h-8 w-24 bg-[#F8F7F4] rounded" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded border border-[#E5E5E2] p-10 text-center">
          <PackageSearch className="h-8 w-8 text-[#A1A1AA] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#242424]">No products found</h3>
          <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
            {searchQuery || stockFilter !== 'all'
              ? 'No warehouse items match your filter.'
              : 'The inventory database returned 0 active products.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded border border-[#E5E5E2] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E2] bg-[#F8F7F4]/80 text-[#71717A] font-semibold">
                  <th className="py-2.5 px-4 w-20">ID</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Available</th>
                  <th className="py-2.5 px-4 w-32">Status</th>
                  <th className="py-2.5 px-4 text-right w-44">Order Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {filteredProducts.map((product) => {
                  const qtyInCart = cart[product.id] || 0;
                  const isOutOfStock = product.available_quantity <= 0;

                  const handleIncrement = () => {
                    if (qtyInCart < product.available_quantity) {
                      onUpdateQuantity(product.id, qtyInCart + 1);
                    }
                  };

                  const handleDecrement = () => {
                    if (qtyInCart > 0) {
                      onUpdateQuantity(product.id, qtyInCart - 1);
                    }
                  };

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-[#F8F7F4]/60 transition-colors ${
                        qtyInCart > 0 ? 'bg-[#FFFDFB]' : ''
                      } ${isOutOfStock ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-[#71717A]">
                        #{product.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#242424]">
                        {product.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[#242424]">
                        ${parseFloat(product.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#242424]">
                        {product.available_quantity}
                      </td>
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FEE2E2]">
                            Out of stock
                          </span>
                        ) : product.available_quantity <= 5 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]">
                            Low stock ({product.available_quantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                            In stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isOutOfStock ? (
                          <div className="inline-flex items-center space-x-1.5 justify-end">
                            <button
                              type="button"
                              onClick={handleDecrement}
                              disabled={qtyInCart === 0}
                              className="h-7 w-7 rounded bg-white hover:bg-[#F8F7F4] disabled:opacity-30 text-[#242424] flex items-center justify-center border border-[#E5E5E2] transition"
                              aria-label={`Decrease quantity for ${product.name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center font-mono font-semibold text-xs tabular-nums text-[#242424]">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              onClick={handleIncrement}
                              disabled={qtyInCart >= product.available_quantity}
                              className="h-7 w-7 rounded bg-[#E96832] hover:bg-[#D45722] disabled:opacity-30 text-white flex items-center justify-center transition shadow-sm"
                              aria-label={`Increase quantity for ${product.name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#A1A1AA] italic">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
