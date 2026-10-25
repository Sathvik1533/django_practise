import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Hash, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import type { OrderCreateResponse } from '../types/api';

interface OrderConfirmationModalProps {
  order: OrderCreateResponse | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Background glow accent */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  HTTP 201 Created
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Order Successfully Placed
                </h3>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-indigo-400" />
              <span>Order #{order.order_id}</span>
            </div>
          </div>

          {/* Meta details bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Status:</span>
              <span className="capitalize font-semibold text-emerald-400 font-mono">
                {order.status}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              <span>Created:</span>
              <span className="text-slate-200 font-mono text-[11px]">
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Itemized Snapshot Table */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Authoritative Backend Item Snapshot
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Price Snapshot Protected
              </span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Product ID</th>
                    <th className="py-2.5 px-3 font-medium text-center">Quantity</th>
                    <th className="py-2.5 px-3 font-medium text-right">Unit Price</th>
                    <th className="py-2.5 px-3 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 text-slate-300">
                        Product #{item.product_id}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        ${parseFloat(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/60 border-t border-slate-800 text-xs">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 text-right font-medium text-slate-300">
                      Order Total:
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono text-sm">
                      ${parseFloat(order.total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <span>Place Another Order</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
