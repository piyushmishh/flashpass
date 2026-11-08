import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { MapPin, Calendar, Clock, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Share2, Info, Ticket } from 'lucide-react';

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      setErrorMsg(err.message || 'Reservation failed. The drop may have sold out.');
    }
  };

  if (loading) {
    return <EventPageSkeleton />;
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-rose-400 space-y-2">
        <AlertCircle className="w-10 h-10 mx-auto" />
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <p className="text-xs text-slate-500">The event you are looking for does not exist or has ended.</p>
      </div>
    );
  }

  const faqs = [
    {
      q: 'When do gates open and what time does the performance start?',
      a: 'Gates open 3 hours prior to showtime (4:30 PM IST). Opening acts start at 6:30 PM, and the headline act takes the stage at 8:00 PM.',
    },
    {
      q: 'How does the digital pass and gate entry work?',
      a: 'Your ticket is cryptographically signed with an HMAC-SHA256 signature and includes an offline-capable QR code. Present it on your smartphone at Gate Turnstiles for instant laser scanning.',
    },
    {
      q: 'What is the refund and cancellation policy?',
      a: 'Due to extreme demand, flash drop tickets are non-refundable. If an event is officially postponed or cancelled by the organizer, automated 100% refunds are initiated to the original payment source.',
    },
    {
      q: 'Are physical wristbands required for VIP Floor access?',
      a: 'Yes. VIP Floor and Lounge ticket holders must exchange their digital QR pass for an RFID fabric wristband at Box Office Counter 3 at the venue.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* ── Event Banner & Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl overflow-hidden bg-[#111320] border border-white/[0.08] shadow-2xl"
      >
        <div className="relative h-72 md:h-80 bg-gradient-to-r from-[#200B3B] via-[#35104E] to-[#120524] flex items-end p-6 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111320] via-black/40 to-transparent" />

          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                Stadium World Tour
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium backdrop-blur-sm">
                Official Live Drop
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400" />
                {event.venue || 'Venue TBA'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                {new Date(event.event_date || event.date || Date.now()).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Gates 4:30 PM
              </span>
            </div>
          </div>
        </div>

        {/* ── Drop Parameters & Booking Container ── */}
        <div className="p-6 md:p-8 space-y-8 bg-[#111320]">
          {/* Live Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-5 rounded-2xl bg-[#161826] border border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider block mb-2">
                Countdown to Sale
              </span>
              <CountdownTimer dropTime={dropTime} />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider block mb-2">
                Live Inventory Allocation
              </span>
              <LiveStockBadge currentStock={displayStock} totalStock={event.total_stock} />
            </div>
          </div>

          {/* Arena Interactive Seat Map */}
          {isDropLive && !isSoldOut && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-300 tracking-wider font-semibold">
                  Select Arena Section
                </span>
                <span className="text-[11px] text-slate-500">Tap zone to reserve</span>
              </div>
              <SeatMap onZoneSelect={handleZoneSelect} selectedZone={selectedZone} />
            </div>
          )}

          {/* Bot Shield (Proof-of-Work Challenge) */}
          {isDropLive && !isSoldOut && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Anti-Bot Cryptographic Verification</span>
              </div>
              <ProofOfWork onSolved={setPowSolution} />
            </div>
          )}

          {/* Price & Instant Reserve Action */}
          <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-3xl font-black text-white">
                ₹{((event.price_cents ?? (event.price ? event.price * 100 : 499900)) / 100).toLocaleString('en-IN')}
                <span className="text-xs text-slate-400 font-normal ml-2">/ pass + taxes</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedZone
                  ? `Selected: ${selectedZone.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} • Max 2 passes per user`
                  : 'Select an arena zone above • Max 2 passes per user'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center bg-[#161826] border border-white/10 rounded-2xl p-1">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      playClick();
                      setQuantity(num);
                    }}
                    disabled={!isDropLive || isSoldOut}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                      quantity === num
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>

              {/* Reserve Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleReserve}
                disabled={!isDropLive || isSoldOut || queueStep !== null || !powSolution}
                className={`px-8 py-3.5 rounded-2xl font-bold text-white transition shadow-xl cursor-pointer ${
                  isSoldOut
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : !isDropLive
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
                    : !powSolution
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/30 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                }`}
              >
                {isSoldOut
                  ? 'Sold Out'
                  : !isDropLive
                  ? 'Drop Starts Soon'
                  : !powSolution
                  ? 'Verifying Humanity...'
                  : '⚡ Reserve Tickets'}
              </motion.button>
            </div>
          </div>

          {queueStep && <QueueStatus step={queueStep} />}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Event Guidelines & Information ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111320] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Ticket className="w-4 h-4" />
            <span>Digital Delivery</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant HMAC-signed digital pass with offline barcode. Add to Apple/Google Wallet on confirmation.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111320] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Govt ID Required</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Name on the booking must match the government photo ID presented at gate turnstiles for entry.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111320] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Age Restriction</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            16+ strictly enforced for standing arena. Minors must be accompanied by an adult passholder.
          </p>
        </div>
      </div>

      {/* ── FAQ Accordion Section ── */}
      <div className="rounded-3xl bg-[#111320] border border-white/[0.06] p-6 md:p-8 space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Frequently Asked Questions</h3>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#161826] border border-white/[0.05] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/[0.03] pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventPage;
