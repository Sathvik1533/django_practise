import React from 'react';
import {
  Clock,
  Terminal,
  ArrowRight,
  ShieldAlert,
  Boxes,
  ShoppingCart,
} from 'lucide-react';
import type { NavTabId } from '../components/Sidebar';

interface PlannedFeatureConfig {
  title: string;
  category: string;
  description: string;
  stage: string;
  plannedEndpoints: string[];
  backendDependencies: string[];
}

const FEATURE_SPECS: Record<string, PlannedFeatureConfig> = {
  'inventory-alerts': {
    title: 'Inventory Threshold Alerts',
    category: 'Operations',
    description:
      'Real-time automated alerting when warehouse SKU availability drops below critical reorder points or when physical quantity reaches zero.',
    stage: 'Stage 8 (Async Tasks)',
    plannedEndpoints: ['GET /api/inventory/alerts/', 'POST /api/inventory/alerts/rules/'],
    backendDependencies: [
      'Celery & Redis periodic task runner',
      'Inventory threshold notification service',
      'Webhook / email notification dispatch',
    ],
  },
  fulfillment: {
    title: 'Fulfillment & Dispatch Engine',
    category: 'Operations',
    description:
      'Warehouse pick-pack-ship orchestration workflows, consignment packing verification, and logistics courier manifest generation.',
    stage: 'Future Operational Slice',
    plannedEndpoints: [
      'POST /api/fulfillment/pick-lists/',
      'PATCH /api/orders/{id}/status/ (pending -> confirmed)',
    ],
    backendDependencies: [
      'Order status state machine transitions',
      'Consignment package tracking models',
      'Carrier shipping label integration',
    ],
  },
  tracking: {
    title: 'Delivery & Carrier Telemetry',
    category: 'Operations',
    description:
      'End-to-end GPS and courier checkpoint tracking for dispatched consignments with automated customer transit updates.',
    stage: 'Carrier Integration Slice',
    plannedEndpoints: [
      'GET /api/tracking/{tracking_number}/',
      'POST /api/webhooks/carrier/events/',
    ],
    backendDependencies: [
      'Carrier webhook ingest handlers',
      'Consignment event timeline models',
      'Public tracking status endpoint',
    ],
  },
  customers: {
    title: 'Customer Directory & Accounts',
    category: 'Management',
    description:
      'Customer account profiles, enterprise client hierarchies, shipping address books, and historical order linkage.',
    stage: 'Stage 7 (JWT Authentication)',
    plannedEndpoints: [
      'GET /api/customers/',
      'POST /api/auth/token/',
      'GET /api/orders/?user=me',
    ],
    backendDependencies: [
      'AUTH_USER_MODEL foreign key migration on Order model',
      'JWT token authentication (SimpleJWT / djangorestframework-simplejwt)',
      'Per-user queryset isolation',
    ],
  },
  reports: {
    title: 'Reports & Throughput Analytics',
    category: 'Management',
    description:
      'Warehouse throughput velocity, inventory turnover ratios, fulfillment latency, and historical order aggregation.',
    stage: 'Reporting Slice',
    plannedEndpoints: [
      'GET /api/analytics/throughput/',
      'GET /api/analytics/stock-turnover/',
    ],
    backendDependencies: [
      'Time-series order reporting views',
      'Aggregated database queries / materialized metrics',
      'Export generation (CSV / XLSX)',
    ],
  },
  settings: {
    title: 'System & Engine Configuration',
    category: 'Management',
    description:
      'Database connection pool tuning, CORS origin management, inventory check constraint rules, and API rate limits.',
    stage: 'Stage 9 (Deployment & Admin)',
    plannedEndpoints: [
      'GET /api/settings/health-metrics/',
      'POST /api/settings/cache-flush/',
    ],
    backendDependencies: [
      'Superuser RBAC authorization',
      'Production settings configuration management',
      'MySQL pool telemetry exporter',
    ],
  },
};

interface PlannedFeaturePageProps {
  featureId: NavTabId;
  onNavigate: (tab: NavTabId) => void;
}

export const PlannedFeaturePage: React.FC<PlannedFeaturePageProps> = ({
  featureId,
  onNavigate,
}) => {
  const spec = FEATURE_SPECS[featureId] || {
    title: 'Planned Feature',
    category: 'Operations',
    description: 'This feature is currently in design and scheduled for a future backend development stage.',
    stage: 'Future Roadmap',
    plannedEndpoints: [],
    backendDependencies: [],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Planned Badge & Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            PLANNED • NOT YET AVAILABLE
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {spec.category} • {spec.stage}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {spec.title}
        </h2>

        <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
          {spec.description}
        </p>

        {/* Honest Disclosure */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block">
              Architectural Honesty Disclosure
            </span>
            <p className="mt-0.5 leading-relaxed">
              In accordance with enterprise engineering standards, mock datasets and fictional interactive controls are withheld.
              This interface will automatically activate once the backend endpoints are implemented and committed by the backend team.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Requirements & Planned API Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Planned Endpoints */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
            <Terminal className="h-4 w-4" />
            <span>Planned API Endpoints</span>
          </div>

          <div className="space-y-2">
            {spec.plannedEndpoints.map((ep, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300"
              >
                {ep}
              </div>
            ))}
          </div>
        </div>

        {/* Backend Dependencies */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs">
            <Clock className="h-4 w-4" />
            <span>Backend Implementation Dependencies</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-400">
            {spec.backendDependencies.map((dep, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{dep}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Return to Live Features CTA */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-white">
            Explore Active Vertical Slices
          </h4>
          <p className="text-[11px] text-slate-400">
            Interact with the verified product catalogue and transactional order creator.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Boxes className="h-3.5 w-3.5 text-indigo-400" />
            <span>Products</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Orders Demo</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
