import React from 'react';

interface MetricsPanelProps {
  stats: {
    ordersByStatus: { status: string; count: string }[];
    totalRevenueCents: number;
    redisOpsPerSec: number;
  };
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ stats }) => {
  const confirmedCount = stats.ordersByStatus.find(s => s.status === 'confirmed')?.count || '0';
  const reservedCount = stats.ordersByStatus.find(s => s.status === 'reserved')?.count || '0';
  const cancelledCount = stats.ordersByStatus.find(s => s.status === 'cancelled' || s.status === 'expired')?.count || '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl relative overflow-hidden">
        <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">Total Revenue</span>
        <div className="text-2xl font-extrabold text-emerald-400 mt-2">
          ₹{(stats.totalRevenueCents / 100).toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-slate-500 block mt-1">ACID Committed</span>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
        <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">Confirmed Passes</span>
        <div className="text-2xl font-extrabold text-blue-400 mt-2">{confirmedCount}</div>
        <span className="text-[11px] text-slate-500 block mt-1">Zero Double-Spend</span>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
        <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">Active In-Flight Holds</span>
        <div className="text-2xl font-extrabold text-amber-400 mt-2">{reservedCount}</div>
        <span className="text-[11px] text-slate-500 block mt-1">TTL Redis Monitored</span>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
        <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">Saga Reclaimed / Expired</span>
        <div className="text-2xl font-extrabold text-rose-400 mt-2">{cancelledCount}</div>
        <span className="text-[11px] text-slate-500 block mt-1">Restored to Inventory</span>
      </div>
    </div>
  );
};
