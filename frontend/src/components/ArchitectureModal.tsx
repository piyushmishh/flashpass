/**
 * ArchitectureModal — SDE Showcase drawer for interviewers and recruiters.
 * Shows the distributed systems design (Redis Lua, Saga pattern, Kafka Outbox,
 * Prometheus metrics) cleanly separated from the consumer booking flow.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Database, Flame, Shield, Activity, GitBranch, Terminal } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal / Slide-over */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#0C0E17] border-l border-white/10 z-50 overflow-y-auto p-6 md:p-8 text-slate-100 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">System Architecture & Design</h2>
                  <p className="text-xs text-slate-400 font-mono">FlashPass Distributed High-Throughput Engine</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architecture Pillars */}
            <div className="py-6 space-y-6">
              {/* Pillar 1: Concurrency & Lock-Free Allocation */}
              <div className="p-5 rounded-2xl bg-[#131625] border border-white/5 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-400">
                  <Flame className="w-5 h-5" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">1. Sub-Millisecond Atomic Stock Lock</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Instead of database row locks (`SELECT FOR UPDATE`) that choke under 10k+ QPS, FlashPass executes an inline 
                  <span className="text-amber-400 font-mono text-xs mx-1 px-1.5 py-0.5 rounded bg-amber-400/10">RESERVE_STOCK_LUA</span>
                  script in Redis. Atomically evaluates available stock, validates user limits, and mints an expiring reservation key in &lt;1.5ms.
                </p>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-slate-400 overflow-x-auto">
                  <code>redis.call('GET', userKey) → redis.call('DECRBY', stockKey) → redis.call('SETEX', userKey, ttl)</code>
                </div>
              </div>

              {/* Pillar 2: Saga Pattern & Compensating Transactions */}
              <div className="p-5 rounded-2xl bg-[#131625] border border-white/5 space-y-3">
                <div className="flex items-center gap-2.5 text-blue-400">
                  <GitBranch className="w-5 h-5" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">2. Distributed Saga & Outbox Pattern</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Dual-write consistency between Redis (speed) and PostgreSQL (durability) is preserved via compensating actions. If PostgreSQL or Kafka fails after a Redis decrement, an automated compensation immediately restores stock in Redis.
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-emerald-400 block font-bold">1. Redis Lock</span>
                    <span className="text-[10px] text-slate-500">Fast path</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-blue-400 block font-bold">2. PG Outbox</span>
                    <span className="text-[10px] text-slate-500">Atomic commit</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-purple-400 block font-bold">3. Kafka Pipe</span>
                    <span className="text-[10px] text-slate-500">Async payment</span>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Bot Shield & Anti-Scalper Proof-of-Work */}
              <div className="p-5 rounded-2xl bg-[#131625] border border-white/5 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">3. Client-Side Cryptographic PoW</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Before reservation submission, browsers must compute a SHA-256 hash matching the difficulty target assigned by <code className="text-emerald-400 text-xs">/api/pow/challenge</code>. Automated sniper bots are throttled by CPU computational cost.
                </p>
              </div>

              {/* Pillar 4: Cryptographic Ticket Minting */}
              <div className="p-5 rounded-2xl bg-[#131625] border border-white/5 space-y-3">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <Database className="w-5 h-5" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">4. Tamper-Proof Digital Passes</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Confirmed tickets generate an HMAC-SHA256 signature combining <code className="text-rose-400 text-xs">orderId + eventId + userId</code> signed with server secret. Scanned at the gate via <code className="text-rose-400 text-xs">/scanner</code> with constant-time verification.
                </p>
              </div>

              {/* Quick links */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="/admin"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                >
                  📊 Open Live Metrics Dashboard
                </a>
                <a
                  href="/api/admin/metrics"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition"
                >
                  📈 Prometheus /metrics endpoint ↗
                </a>
                <a
                  href="/scanner"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition"
                >
                  📱 Gate Scanner Portal ↗
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ArchitectureModal;
