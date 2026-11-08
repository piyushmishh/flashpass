/**
 * OrderReceipt — holographic event pass with shimmer animation,
 * tear-off stub, barcode pattern, and downloadable ticket.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';

interface OrderReceiptProps {
  orderId: string;
  totalPriceCents: number;
  quantity: number;
  confirmedAt?: string;
  eventTitle?: string;
  eventVenue?: string;
  eventDate?: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  orderId,
  totalPriceCents,
  quantity,
  confirmedAt,
  eventTitle,
  eventVenue,
  eventDate,
}) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleDownload = () => {
    window.open(`/api/orders/${orderId}/ticket`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="max-w-md mx-auto"
    >
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        onMouseMove={handleMouseMove}
      >
        {/* Holographic shimmer layer — tracks mouse */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-40"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(120,119,198,0.3) 0%, transparent 50%), 
                         linear-gradient(135deg, #ff6b6b11, #ffa50011, #ffff0011, #00ff0011, #0000ff11, #8b00ff11, #ff6b6b11)`,
            backgroundSize: '100% 100%, 400% 400%',
            animation: 'rainbowShift 8s ease infinite',
          }}
        />

        {/* Main ticket body */}
        <div className="relative bg-slate-800/90 backdrop-blur-md border border-emerald-500/30 holo-card">
          {/* Glow highlight */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

          {/* ADMIT stamp watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
            <span className="text-6xl font-black text-white/[0.03] rotate-[-15deg] block tracking-widest select-none">
              VIP ACCESS
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <h2 className="text-2xl font-black text-white tracking-tight">Pass Confirmed!</h2>
            {eventTitle && (
              <p className="text-base font-semibold text-blue-400 mt-1">{eventTitle}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Your ticket is secured and verified</p>

            {/* Event details */}
            {(eventVenue || eventDate) && (
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                {eventVenue && <span>📍 {eventVenue}</span>}
                {eventDate && <span>📅 {new Date(eventDate).toLocaleDateString()}</span>}
              </div>
            )}
          </div>

          {/* Perforation line */}
          <div className="relative z-10 flex items-center px-4">
            <div className="w-4 h-8 bg-slate-900 rounded-r-full -ml-4" />
            <div className="flex-1 border-t-2 border-dashed border-slate-700/60" />
            <div className="w-4 h-8 bg-slate-900 rounded-l-full -mr-4" />
          </div>

          {/* Ticket details — stub section */}
          <div className="relative z-10 p-6">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-left space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider">Order ID</span>
                <span className="text-blue-400 font-bold break-all">{orderId}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-500">Tickets:</span>
                <span className="text-slate-200 font-bold">{quantity} Pass{quantity > 1 ? 'es' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-emerald-400 font-bold">₹{(totalPriceCents / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-500">Confirmed:</span>
                <span className="text-slate-400">{confirmedAt ? new Date(confirmedAt).toLocaleString() : 'Just now'}</span>
              </div>
            </div>

            {/* QR code placeholder */}
            <div className="mt-4 flex flex-col items-center">
              <div className="w-32 h-32 bg-white p-2.5 rounded-2xl shadow-lg shadow-black/20">
                <div className="grid grid-cols-5 gap-1 w-full h-full">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        [0,1,2,4,5,6,10,12,14,18,20,21,22,24].includes(i)
                          ? 'bg-slate-900'
                          : [3,7,8,11,16,17,23].includes(i)
                          ? 'bg-slate-700'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mt-2">
                Digital Pass Signature
              </span>
            </div>

            {/* Barcode strip */}
            <div className="mt-4 flex justify-center gap-[2px] h-8">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-600/40 rounded-sm"
                  style={{ width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition text-sm"
        >
          <Download className="w-4 h-4" />
          Download Ticket
          <ExternalLink className="w-3 h-3 opacity-50" />
        </button>

        <Link
          to="/orders"
          className="block w-full text-center py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition text-sm"
        >
          View in My Passes
        </Link>

        <Link
          to="/"
          className="block text-center text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Return to Events Discovery
        </Link>
      </div>
    </motion.div>
  );
};

export default OrderReceipt;
