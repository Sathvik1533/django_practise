import React from 'react';
import { Package, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import type { Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  selectedQuantity: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedQuantity,
  onUpdateQuantity,
}) => {
  const isOutOfStock = product.available_quantity <= 0;
  const isInactive = !product.is_active;
  const isOrderable = product.is_active && product.available_quantity > 0;

  const handleIncrement = () => {
    if (selectedQuantity < product.available_quantity) {
      onUpdateQuantity(product.id, selectedQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (selectedQuantity > 0) {
      onUpdateQuantity(product.id, selectedQuantity - 1);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
        selectedQuantity > 0
          ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80'
      } ${!isOrderable ? 'opacity-60' : ''}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-slate-800/80 text-indigo-400">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">
                {product.sku}
              </span>
              <h3 className="text-base font-semibold text-white tracking-tight">
                {product.name}
              </h3>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium border bg-slate-800 text-slate-300 border-slate-700">
            ID: #{product.id}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1">/ unit</span>
          </div>

          <div>
            {isInactive ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                <AlertCircle className="h-3 w-3" /> Inactive
              </span>
            ) : isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                <AlertCircle className="h-3 w-3" /> Out of stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <Check className="h-3 w-3" /> {product.available_quantity} available
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Order Quantity:</span>

        {isOrderable ? (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={selectedQuantity === 0}
              className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 flex items-center justify-center transition border border-slate-700"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="w-10 text-center font-mono font-bold text-white text-sm">
              {selectedQuantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={selectedQuantity >= product.available_quantity}
              className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Not orderable</span>
        )}
      </div>
    </div>
  );
};
