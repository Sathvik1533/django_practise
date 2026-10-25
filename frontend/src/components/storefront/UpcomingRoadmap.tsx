import React from 'react';
import { Clock, Truck, BellRing, Compass, BarChart3 } from 'lucide-react';

const ROADMAP_ITEMS = [
  {
    icon: Truck,
    title: 'Order Tracking & Fulfillment',
    description: 'Live courier tracking integration with real-time transit milestones from dispatch to delivery.',
    status: 'Planned',
  },
  {
    icon: BellRing,
    title: 'Low-Stock Inventory Alerts',
    description: 'Automated notification pipeline warning shoppers before high-demand festive sizes sell out.',
    status: 'Planned',
  },
  {
    icon: Compass,
    title: 'Shipping & Delivery Management',
    description: 'Self-serve delivery rescheduling, address modifications, and instant return scheduling.',
    status: 'Planned',
  },
  {
    icon: BarChart3,
    title: 'Operations Analytics',
    description: 'Deep logistical telemetry and fulfillment rate benchmarks across regional distribution hubs.',
    status: 'Planned',
  },
];

export const UpcomingRoadmap: React.FC = () => {
  return (
    <section className="border-t border-[#E5E5E2] pt-10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E96832]" />
            Platform Evolution
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#242424] tracking-tight">
            Coming Next to Aura Store
          </h2>
        </div>
        <p className="text-xs text-[#71717A]">
          Order placement is currently active. The capabilities below are under active development.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ROADMAP_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white border border-[#E5E5E2] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#F8F7F4] border border-[#E5E5E2] flex items-center justify-center text-[#52525B]">
                    <Icon className="w-4 h-4 text-[#71717A]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#F4F4F5] text-[#71717A] px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#242424] leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
