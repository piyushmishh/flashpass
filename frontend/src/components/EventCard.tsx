/**
 * EventCard — polished card for event listings.
 * Shows live stock, countdown, and a gradient image placeholder.
 */

import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import type { Event } from '@/types';
import CountdownTimer from './CountdownTimer';
import clsx from 'clsx';

// Rotating gradient backgrounds when no image is provided
const GRADIENTS = [
  'from-blue-600 via-violet-600 to-purple-600',
  'from-emerald-600 via-teal-600 to-cyan-600',
  'from-orange-500 via-red-500 to-pink-500',
  'from-indigo-600 via-blue-600 to-sky-500',
  'from-pink-600 via-fuchsia-600 to-purple-600',
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
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const stockPct = totalStock > 0 ? (currentStock / totalStock) * 100 : 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block rounded-2xl overflow-hidden glass transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-neon-blue/10 hover:border-neon-blue/30"
    >
      {/* ── Image / Gradient hero ─────────────────────────────── */}
      <div className="relative h-44 overflow-hidden">
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
              'group-hover:scale-105 transition-transform duration-500',
            )}
          />
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isLive && !isSoldOut && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-xs font-bold backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE NOW
            </span>
          )}
          {isSoldOut && (
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-400 text-xs font-bold backdrop-blur-sm">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white font-bold text-sm border border-slate-700/50">
            ₹{price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Card body ─────────────────────────────────────────── */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
          {event.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {event.venue}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(eventDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        {/* Live stock mini bar */}
        {!isSoldOut && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={clsx(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  stockPct > 30 ? 'bg-emerald-400' : 'bg-amber-400',
                )}
              />
              <span
                className={clsx(
                  'relative inline-flex rounded-full h-2 w-2',
                  stockPct > 30 ? 'bg-emerald-500' : 'bg-amber-500',
                )}
              />
            </span>
            <span className="text-xs text-slate-400">
              <span className={clsx('font-semibold', stockPct > 30 ? 'text-emerald-400' : 'text-amber-400')}>
                {currentStock.toLocaleString()}
              </span>{' '}
              tickets left
            </span>
          </div>
        )}

        {/* Countdown or CTA */}
        {!isLive && !isSoldOut ? (
          <CountdownTimer dropTime={dropTime} compact />
        ) : (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 group-hover:gap-2.5 transition-all duration-200">
              View Drop
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default EventCard;
