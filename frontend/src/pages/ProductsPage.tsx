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
      // Search matching
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toString() === searchQuery.trim();

      if (!matchesSearch) return false;

      // Filter matching
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
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="h-5 w-5 text-indigo-400" />
            <span>Warehouse Products & Stock Inventory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real inventory records fetched directly from <code className="text-indigo-300 font-mono">GET /api/products/</code>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {totalSelectedUnits > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Review Order ({totalSelectedUnits})</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'in-stock', label: 'In Stock' },
              { id: 'low-stock', label: 'Low Stock (≤5)' },
              { id: 'out-of-stock', label: 'Out of Stock' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStockFilter(filter.id)}
              className={`px-3 py-1 rounded-lg font-medium transition text-xs whitespace-nowrap ${
                stockFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Loading, Error, Empty, or Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-28 bg-slate-800 rounded" />
                <div className="h-6 w-44 bg-slate-800 rounded" />
              </div>
              <div className="h-10 w-full bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">
            Failed to Load Products from Backend
          </h3>
          <p className="text-xs text-rose-300 mt-1">{error.message}</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-semibold transition"
            >
              Retry GET /api/products/
            </button>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <PackageSearch className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No products found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || stockFilter !== 'all'
              ? 'No warehouse items match your current filter criteria.'
              : 'The Django inventory database has returned 0 active products.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div
                key={product.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-150 ${
                  qtyInCart > 0
                    ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                } ${isOutOfStock ? 'opacity-65' : ''}`}
              >
                <div>
                  {/* Top Bar: SKU / ID + Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-semibold">
                      Product #{product.id}
                    </span>

                    {isOutOfStock ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Out of stock
                      </span>
                    ) : product.available_quantity <= 5 ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Low stock ({product.available_quantity})
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        In stock ({product.available_quantity})
                      </span>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div className="mt-3">
                    <h3 className="text-base font-semibold text-white tracking-tight line-clamp-1">
                      {product.name}
                    </h3>

                    <div className="mt-2 flex items-baseline space-x-1.5">
                      <span className="text-xl font-bold font-mono text-white">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">/ unit</span>
                    </div>
                  </div>

                  {/* Available Stock Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Warehouse Stock:</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {product.available_quantity} available
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOutOfStock
                            ? 'bg-rose-500 w-0'
                            : product.available_quantity <= 5
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(5, (product.available_quantity / 50) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Quantity Selection */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Order Quantity:</span>

                  {!isOutOfStock ? (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={qtyInCart === 0}
                        className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 flex items-center justify-center transition border border-slate-700"
                        aria-label={`Decrease quantity for ${product.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="w-8 text-center font-mono font-bold text-white text-xs">
                        {qtyInCart}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={qtyInCart >= product.available_quantity}
                        className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition shadow-sm"
                        aria-label={`Increase quantity for ${product.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Unavailable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
