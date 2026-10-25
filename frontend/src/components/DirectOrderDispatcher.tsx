import React, { useState } from 'react';
import { Send, Terminal, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import type { OrderCreateRequest, OrderCreateResponse, ApiError } from '../types/api';
import { createOrder } from '../services/api';

interface DirectOrderDispatcherProps {
  onOrderSuccess: (order: OrderCreateResponse) => void;
}

interface RawItemRow {
  productId: string;
  quantity: string;
}

export const DirectOrderDispatcher: React.FC<DirectOrderDispatcherProps> = ({
  onOrderSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<RawItemRow[]>([
    { productId: '1', quantity: '1' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleAddRow = () => {
    setRows([...rows, { productId: '', quantity: '1' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: keyof RawItemRow, value: string) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const parsedItems = rows.map((r) => ({
      product_id: parseInt(r.productId, 10),
      quantity: parseInt(r.quantity, 10),
    }));

    for (const item of parsedItems) {
      if (isNaN(item.product_id) || item.product_id <= 0) {
        setError({ message: 'All product IDs must be positive integers.' });
        return;
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        setError({ message: 'All quantities must be positive integers.' });
        return;
      }
    }

    const payload: OrderCreateRequest = { items: parsedItems };

    setLoading(true);
    try {
      const res = await createOrder(payload);
      onOrderSuccess(res);
    } catch (err: unknown) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-4 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-sky-400" />
          <div>
            <h3 className="text-xs font-semibold text-slate-300">
              Direct API Dispatcher (QA & Diagnostic Tool)
            </h3>
            <p className="text-[11px] text-slate-500">
              Send raw payloads directly to <code className="text-slate-400">POST /api/orders/</code> without mock data
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          {isOpen ? 'Collapse Dispatcher' : 'Open Dispatcher'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    placeholder="Product ID (e.g. 1)"
                    value={row.productId}
                    onChange={(e) => handleUpdateRow(idx, 'productId', e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => handleUpdateRow(idx, 'quantity', e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  disabled={rows.length === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-20 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item Row</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-semibold text-white shadow-md shadow-sky-600/20 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting POST...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Execute POST /api/orders/</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error.message}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
