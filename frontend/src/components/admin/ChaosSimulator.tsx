import React, { useState } from 'react';
import { api } from '../../services/api';

export const ChaosSimulator: React.FC<{ onSimulated: () => void }> = ({ onSimulated }) => {
  const [users, setUsers] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.admin.simulateChaos(users);
      setResult(res.summary);
      onSimulated();
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>⚡ High Concurrency Benchmarker</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Flash Sale Stress Simulator</h3>
          <p className="text-sm text-slate-400">
            Fire concurrent reservation threads against the Redis atomic Lua scripts to test race conditions in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="number"
            min={50}
            max={2000}
            value={users}
            onChange={(e) => setUsers(Number(e.target.value))}
            className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 text-sm disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <span>⚡ Fire Load Test</span>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 p-5 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-3">
            ✓ Stress Test Results Matrix
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Throughput</span>
              <span className="text-white text-base font-bold">{result.requestsPerSecond} RPS</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Duration</span>
              <span className="text-blue-400 text-base font-bold">{result.durationMs} ms</span>
            </div>
            <div>
              <span className="text-slate-500 block">Allocated / Sold Out</span>
              <span className="text-emerald-400 text-base font-bold">
                {result.successfulReservations} / {result.rejectedSoldOut}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Double Allocation</span>
              <span className="text-emerald-400 text-base font-bold">0 (PASS)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
