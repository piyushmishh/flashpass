import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCountdown } from '../hooks/useCountdown';
import { CountdownTimer } from '../components/CountdownTimer';
import { LiveStockBadge } from '../components/LiveStockBadge';
import { QueueStatus } from '../components/QueueStatus';
import { SeatMap } from '../components/SeatMap';
import { ProofOfWork } from '../components/ProofOfWork';
import { EventPageSkeleton } from '../components/Skeleton';
import { playClick, playReserved } from '../hooks/useSound';
import { Event } from '../types';

interface PowSolution {
  nonce: string;
  hash: string;
  challenge: string;
}

export const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [queueStep, setQueueStep] = useState<'locking' | 'reserved' | 'redirecting' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [powSolution, setPowSolution] = useState<PowSolution | null>(null);

  const { currentStock } = useWebSocket(id || '');

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const data = await api.events.getById(id);
        setEvent(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const dropTime = event?.drop_time ? new Date(event.drop_time) : new Date();
  const countdown = useCountdown(dropTime);
  const isDropLive = countdown.isExpired;

  const displayStock = currentStock !== null ? currentStock : (event?.current_stock ?? 0);
  const isSoldOut = displayStock <= 0;

  const handleZoneSelect = (zone: string) => {
    playClick();
    setSelectedZone(zone === selectedZone ? null : zone);
    setQuantity(1);
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;

    setErrorMsg(null);
    setQueueStep('locking');

    try {
      setTimeout(() => setQueueStep('reserved'), 400);

      const idempotencyKey = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const powHeaders = powSolution
        ? { nonce: powSolution.nonce, hash: powSolution.hash, challenge: powSolution.challenge }
        : undefined;

      const result = await api.orders.reserve(id, quantity, idempotencyKey, powHeaders);

      playReserved();
      setQueueStep('redirecting');
      setTimeout(() => {
        navigate(`/checkout/${result.order.id}`);
      }, 500);
    } catch (err: any) {
      setQueueStep(null);
      setErrorMsg(err.message || 'Failed to reserve ticket. Event might be sold out.');
    }
  };

  if (loading) {
    return <EventPageSkeleton />;
  }

  if (!event) {
    return <div className="text-center py-20 text-rose-400">Event Not Found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Event Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl"
      >
        <div className="h-64 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 flex items-center px-8 relative">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
              Exclusive Drop
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{event.title}</h1>
            <p className="text-slate-300 text-sm md:text-base flex items-center space-x-2">
              <span>📍 {event.venue}</span>
              <span>•</span>
              <span>📅 {new Date(event.event_date || event.date || Date.now()).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-slate-900/90 backdrop-blur-md">
          {/* Countdown & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block mb-2">
                Countdown to Drop
              </span>
              <CountdownTimer dropTime={dropTime} />
            </div>
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block mb-2">
                Live Inventory Status
              </span>
              <LiveStockBadge currentStock={displayStock} totalStock={event.total_stock} />
            </div>
          </div>

          {/* Arena Seat Map */}
          {isDropLive && !isSoldOut && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block mb-3">
                Select Your Zone
              </span>
              <SeatMap
                onZoneSelect={handleZoneSelect}
                selectedZone={selectedZone}
              />
            </motion.div>
          )}

          {/* PoW Challenge */}
          {isDropLive && !isSoldOut && (
            <ProofOfWork onSolved={setPowSolution} />
          )}

          {/* Price & Reserve */}
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black text-white">
                ₹{((event.price_cents ?? (event.price ? event.price * 100 : 499900)) / 100).toLocaleString('en-IN')}
                <span className="text-xs text-slate-400 font-normal ml-2">/ pass</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedZone
                  ? `Zone: ${selectedZone.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} • Max 2 per user`
                  : 'Maximum 2 tickets per authenticated user'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    onClick={() => { playClick(); setQuantity(num); }}
                    disabled={!isDropLive || isSoldOut}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      quantity === num
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReserve}
                disabled={!isDropLive || isSoldOut || queueStep !== null || !powSolution}
                className={`px-8 py-3.5 rounded-xl font-bold text-white transition shadow-lg ${
                  isSoldOut
                    ? 'bg-slate-800 cursor-not-allowed opacity-50'
                    : !isDropLive
                    ? 'bg-slate-800 cursor-not-allowed opacity-60'
                    : !powSolution
                    ? 'bg-slate-800 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                }`}
              >
                {isSoldOut ? 'Sold Out' : !isDropLive ? 'Drop Starts Soon' : !powSolution ? 'Solving Challenge...' : '⚡ Instant Reserve'}
              </motion.button>
            </div>
          </div>

          {queueStep && <QueueStatus step={queueStep} />}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm"
            >
              {errorMsg}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EventPage;
