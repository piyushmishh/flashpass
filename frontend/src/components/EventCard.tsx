/**
 * EventCard — polished editorial card for concert listings.
 * Shows live stock, countdown, phase pricing, and venue details.
 */

import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Flame, Clock } from 'lucide-react';
import type { Event } from '@/types';
import CountdownTimer from './CountdownTimer';
import clsx from 'clsx';

// Editorial artistic gradients / concert stage aesthetics
const HERO_GRADIENTS = [
  'from-[#3D144C] via-[#631B75] to-[#B33939]',
  'from-[#0A3D62] via-[#1E5F74] to-[#1D2D50]',
  'from-[#3B185F] via-[#2A0845] to-[#640064]',
  'from-[#192A56] via-[#273C75] to-[#40739E]',
];

interface Props {
  event: Event;
  index?: number;
}

export function EventCard({ event, index = 0 }: Props) {
  const currentStock = event.current_stock ?? event.currentStock ?? 0;
  const totalStock = event.total_stock ?? event.totalStock ?? 1;
  const price = event.price ?? (event.price_cents ? event.price_cents / 100 : 4999);
  const eventDate = event.event_date ?? event.date ?? new Date().toISOString();
  const dropTime = event.drop_time ?? event.dropTime ?? new Date().toISOString();

  const isLive = event.status === 'live' || (new Date(dropTime).getTime() <= Date.now() && currentStock > 0);
  const isSoldOut = event.status === 'soldout' || currentStock <= 0;
  const gradient = HERO_GRADIENTS[index % HERO_GRADIENTS.length];
  const stockPct = totalStock > 0 ? (currentStock / totalStock) * 100 : 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block rounded-3xl overflow-hidden bg-[#111320] border border-white/[0.08] hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col"
    >
      {/* ── Image / Visual Banner ── */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        {event.imageUrl || event.image_url ? (
          <img
            src={event.imageUrl || event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={clsx(
              'w-full h-full bg-gradient-to-br',
              gradient,
              'group-hover:scale-105 transition-transform duration-500 flex items-center justify-center p-6 text-center',
            )}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/60">Live Experience</span>
              <p className="text-xl font-black text-white tracking-tight line-clamp-1">{event.title}</p>
            </div>
          </div>
        )}

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111320] via-transparent to-black/30 pointer-events-none" />

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isLive && !isSoldOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg shadow-rose-600/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              DROP IS LIVE
            </span>
          )}
          {isSoldOut && (
            <span className="px-3 py-1 rounded-full bg-black/80 text-slate-400 text-[11px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10">
              SOLD OUT
            </span>
          )}
          {!isLive && !isSoldOut && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 text-[11px] font-bold backdrop-blur-md border border-purple-500/30">
              <Clock className="w-3 h-3" />
              DROP SOON
            </span>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white font-extrabold text-sm border border-white/10 shadow-lg">
            ₹{price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {event.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {event.venue || 'TBA'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Stock / Urgency Indicator */}
        <div className="space-y-3 pt-2 border-t border-white/[0.05]">
          {!isSoldOut && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Flame className={clsx('w-3.5 h-3.5', stockPct < 30 ? 'text-rose-400' : 'text-amber-400')} />
                <span className={clsx('font-bold', stockPct < 30 ? 'text-rose-400' : 'text-slate-200')}>
                  {currentStock.toLocaleString()}
                </span>{' '}
                passes left
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Phase 2</span>
            </div>
          )}

          {/* Action button / Countdown */}
          {!isLive && !isSoldOut ? (
            <div className="pt-1">
              <CountdownTimer dropTime={dropTime} compact />
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1 text-xs font-bold text-purple-400 group-hover:text-purple-300 transition">
              <span>{isSoldOut ? 'View Waitlist Details' : 'Select Seats & Book'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default EventCard;
