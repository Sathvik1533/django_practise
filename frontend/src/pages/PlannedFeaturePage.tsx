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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Planned Badge & Header */}
      <div className="bg-white rounded border border-[#E5E5E2] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7] font-semibold flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            PLANNED • NOT YET AVAILABLE
          </span>
          <span className="text-xs text-[#71717A] font-mono">
            {spec.category} • {spec.stage}
          </span>
        </div>

        <h1 className="text-xl font-bold text-[#242424] tracking-tight">
          {spec.title}
        </h1>

        <p className="mt-1.5 text-xs text-[#71717A] leading-relaxed max-w-2xl">
          {spec.description}
        </p>

        {/* Honest Disclosure */}
        <div className="mt-5 p-3.5 rounded bg-[#F8F7F4] border border-[#E5E5E2] text-xs text-[#71717A] flex items-start space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#242424] block">
              Architectural Honesty Disclosure
            </span>
            <p className="mt-0.5 leading-relaxed">
              In accordance with operational standards, mock data and simulated controls are withheld.
              This interface will activate once the backend endpoints are implemented.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Planned Endpoints */}
        <div className="bg-white rounded border border-[#E5E5E2] p-4 shadow-sm space-y-2.5">
          <div className="flex items-center space-x-2 text-[#E96832] font-semibold text-xs">
            <Terminal className="h-4 w-4" />
            <span>Planned API Endpoints</span>
          </div>

          <div className="space-y-1.5">
            {spec.plannedEndpoints.map((ep, i) => (
              <div
                key={i}
                className="px-2.5 py-1.5 rounded bg-[#F8F7F4] border border-[#E5E5E2] font-mono text-[11px] text-[#242424]"
              >
                {ep}
              </div>
            ))}
          </div>
        </div>

        {/* Backend Dependencies */}
        <div className="bg-white rounded border border-[#E5E5E2] p-4 shadow-sm space-y-2.5">
          <div className="flex items-center space-x-2 text-[#71717A] font-semibold text-xs">
            <Clock className="h-4 w-4" />
            <span>Backend Implementation Dependencies</span>
          </div>

          <ul className="space-y-1.5 text-xs text-[#71717A]">
            {spec.backendDependencies.map((dep, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-[#E96832] font-bold">•</span>
                <span>{dep}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Return to Live Workflows */}
      <div className="bg-white rounded border border-[#E5E5E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div>
          <h4 className="text-xs font-semibold text-[#242424]">
            Active Logistics Operations
          </h4>
          <p className="text-[11px] text-[#71717A]">
            Manage inventory or create orders with live database stock reservation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="px-3 py-1.5 rounded bg-white hover:bg-[#F8F7F4] text-[#242424] text-xs font-medium border border-[#E5E5E2] transition flex items-center space-x-1.5"
          >
            <Boxes className="h-3.5 w-3.5 text-[#E96832]" />
            <span>Products</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="px-3 py-1.5 rounded bg-[#E96832] hover:bg-[#D45722] text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Orders</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
