import React from 'react';

interface QueueStatusProps {
  step: 'locking' | 'reserved' | 'redirecting';
}

export const QueueStatus: React.FC<QueueStatusProps> = ({ step }) => {
  return (
    <div className="bg-slate-850 border border-blue-500/30 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin flex items-center justify-center" />
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            {step === 'locking' && 'Acquiring Redis Distributed Lock...'}
            {step === 'reserved' && 'Stock Reserved! Allocating Checkout Window...'}
            {step === 'redirecting' && 'Redirecting to Secure Payment Gateway...'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Sub-2ms atomic verification in Redis cluster
          </p>
        </div>
      </div>
    </div>
  );
};
