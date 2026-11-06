import React from 'react';
import { Link } from 'react-router-dom';

interface OrderReceiptProps {
  orderId: string;
  totalPriceCents: number;
  quantity: number;
  confirmedAt?: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  orderId,
  totalPriceCents,
  quantity,
  confirmedAt
}) => {
  return (
    <div className="max-w-md mx-auto bg-slate-800/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

      <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight">Pass Confirmed!</h2>
      <p className="text-sm text-slate-400 mt-1">Your reservation has been permanently minted into PostgreSQL</p>

      <div className="my-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-left space-y-3 font-mono text-xs">
        <div>
          <span className="text-slate-500 block uppercase">Order ID</span>
          <span className="text-blue-400 font-bold break-all">{orderId}</span>
        </div>
        <div className="flex justify-between border-t border-slate-800 pt-2">
          <span className="text-slate-500">Tickets Allocated:</span>
          <span className="text-slate-200 font-bold">{quantity} VIP Pass</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Amount Paid:</span>
          <span className="text-emerald-400 font-bold">₹{(totalPriceCents / 100).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between border-t border-slate-800 pt-2">
          <span className="text-slate-500">Timestamp:</span>
          <span className="text-slate-400">{confirmedAt ? new Date(confirmedAt).toLocaleString() : 'Just now'}</span>
        </div>
      </div>

      {/* Styled Mock QR Code */}
      <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center justify-center">
        <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-80">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`rounded-sm ${i % 3 === 0 ? 'bg-black' : i % 2 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
          ))}
        </div>
      </div>
      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block mt-2">Digital Pass Signature</span>

      <div className="mt-8 space-y-3">
        <Link
          to="/orders"
          className="block w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition text-sm"
        >
          View in My Passes
        </Link>
        <Link
          to="/"
          className="block text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Return to Events Discovery
        </Link>
      </div>
    </div>
  );
};
