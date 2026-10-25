import React from 'react';
import { PackageSearch, RefreshCw, AlertCircle, ServerCrash } from 'lucide-react';
import type { Product, ApiError } from '../types/api';
import { ProductCard } from './ProductCard';

interface ProductCatalogueProps {
  products: Product[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  cart: Record<number, number>;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export const ProductCatalogue: React.FC<ProductCatalogueProps> = ({
  products,
  loading,
  error,
  onRetry,
  cart,
  onUpdateQuantity,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-6 w-40 bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-800 rounded mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Catalogue unavailable (e.g. 404 from missing backend endpoint)
  if (error) {
    const is404 = error.status === 404;

    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          {is404 ? <ServerCrash className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
        </div>

        <h3 className="text-base font-semibold text-white">
          {is404 ? 'Product Catalogue API Pending Implementation' : 'Failed to Load Catalogue'}
        </h3>

        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          {is404 ? (
            <>
              The endpoint <code className="text-amber-300 font-mono">GET /api/products/</code> is currently being built by Kiro.
              Per engineering rules, mock product data is prohibited so inventory integrity is preserved.
            </>
          ) : (
            error.message
          )}
        </p>

        <div className="mt-5 max-w-lg mx-auto bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-left font-mono text-xs">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>Expected Backend Contract (Stage 6):</span>
            <span className="text-amber-400">HTTP 404 Not Found</span>
          </div>
          <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 bg-slate-900/80 rounded border border-slate-800/80">
{`GET /api/products/
Response: 200 OK
[
  {
    "id": 1,
    "name": "Laptop",
    "sku": "LAP-001",
    "price": "1000.00",
    "is_active": true,
    "available_quantity": 7
  }
]`}
          </pre>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry GET /api/products/</span>
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-slate-500 mb-2" />
        <h3 className="text-sm font-semibold text-slate-200">No products found</h3>
        <p className="text-xs text-slate-400 mt-1">
          The database currently has no active products in the catalogue.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Warehouse Catalogue
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stock figures backed by MySQL InnoDB locking
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
          {products.length} Products Loaded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selectedQuantity={cart[product.id] || 0}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
    </div>
  );
};
