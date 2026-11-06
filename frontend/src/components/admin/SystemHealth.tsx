import React from 'react';

interface SystemHealthProps {
  health: {
    status: string;
    services: {
      database: string;
      redis: string;
      kafka: string;
    };
  };
  redisOps: number;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ health, redisOps }) => {
  const getBadge = (status: string) => {
    return status === 'healthy' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        ONLINE
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        DEGRADED
      </span>
    );
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white tracking-wide">Infrastructure Cluster Health</h3>
        <span className="text-xs text-slate-400 font-mono">Heartbeat Scraped</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">PostgreSQL (Primary)</div>
            <div className="text-xs text-slate-400 mt-0.5">ACID Row Locking Engine</div>
          </div>
          {getBadge(health.services.database)}
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Redis 7 In-Memory</div>
            <div className="text-xs text-slate-400 mt-0.5">{redisOps} ops/sec instantaneous</div>
          </div>
          {getBadge(health.services.redis)}
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Kafka Broker</div>
            <div className="text-xs text-slate-400 mt-0.5">Transactional Outbox Stream</div>
          </div>
          {getBadge(health.services.kafka)}
        </div>
      </div>
    </div>
  );
};
