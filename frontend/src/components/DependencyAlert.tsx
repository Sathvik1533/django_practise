import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Lock, Terminal } from 'lucide-react';

export const DependencyAlert: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white">
                Integration Status: Stage 6 React Frontend
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                Awaiting GET /api/products/
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Order submission (<code className="text-slate-300">POST /api/orders/</code>) is active and integrated with safe inventory locking. The Product Catalogue API (<code className="text-slate-300">GET /api/products/</code>) is currently owned and pending implementation by Kiro.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 transition"
        >
          {expanded ? 'Hide Details' : 'View Contract Specs'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>POST /api/orders/</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Fully active. Accepts <code className="text-slate-300">{`{"items": [{"product_id": X, "quantity": Y}]}`}</code>. Enforces database row locking and records price snapshots.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold mb-1">
              <Terminal className="h-3.5 w-3.5" />
              <span>GET /api/products/</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pending backend deployment by Kiro. The frontend catalogue client will automatically render warehouse inventory once this endpoint returns HTTP 200.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-1">
              <Lock className="h-3.5 w-3.5" />
              <span>JWT Authentication</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Planned for Stage 7. Login interface is intentionally withheld until Kiro establishes the JWT endpoint and auth contract.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
