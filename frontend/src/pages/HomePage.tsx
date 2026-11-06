import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.events.getAll();
        setEvents(data);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Distributed Flash-Sale Engine Active</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Next-Gen Passes for <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            High-Velocity Drops
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          Engineered to absorb 10,000+ concurrent checkout requests without dropping packets,
          deadlocking databases, or double-selling a single ticket.
        </p>

        <div className="flex justify-center space-x-4 pt-2">
          <Link
            to="/admin"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            📊 View System Telemetry
          </Link>
        </div>
      </section>

      {/* Drops Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active & Upcoming Drops</h2>
            <p className="text-sm text-slate-400">Real-time inventory managed via Redis Lua Scripts</p>
          </div>
          <span className="text-xs font-mono text-emerald-400">Live WebSocket Synced</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No active events available. Run database seed to populate events.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
