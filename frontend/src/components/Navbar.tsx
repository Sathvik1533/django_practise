import React from 'react';
import { Activity, Server, ShieldAlert } from 'lucide-react';
import type { BackendHealthResponse } from '../types/api';

interface NavbarProps {
  health: BackendHealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const isHealthy = health?.status === 'ok';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Server className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Logistics Flow Engine
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Stage 6
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Django 6.1 • DRF • MySQL Row-Locking Architecture
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onRefreshHealth}
            disabled={healthLoading}
            title="Click to re-verify GET /health/"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 transition text-xs font-mono"
          >
            <Activity
              className={`h-3.5 w-3.5 ${
                healthLoading
                  ? 'animate-spin text-amber-400'
                  : isHealthy
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            />
            <span className="text-slate-300">Backend:</span>
            {healthLoading ? (
              <span className="text-amber-400">Pinging...</span>
            ) : isHealthy ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online (/health/)
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 inline" />
                Unreachable
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
