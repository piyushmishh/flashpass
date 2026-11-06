import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MetricsPanel } from '../components/admin/MetricsPanel';
import { SystemHealth } from '../components/admin/SystemHealth';
import { ChaosSimulator } from '../components/admin/ChaosSimulator';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const [statsData, healthData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getHealth()
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to poll admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Loading Telemetry Feeds...</div>;
  }

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Production Metrics Node</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Telemetry & Engine Health</h1>
          <p className="text-sm text-slate-400">Real-time distributed cluster performance and concurrency locks</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono text-emerald-400 font-medium">Telemetry Polling (3s)</span>
        </div>
      </div>

      {stats && <MetricsPanel stats={stats} />}

      {health && <SystemHealth health={health} redisOps={stats?.redisOpsPerSec || 0} />}

      <ChaosSimulator onSimulated={fetchDashboardData} />
    </div>
  );
};
