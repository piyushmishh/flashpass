import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { ArchitectureModal } from '../components/ArchitectureModal';
import { Flame, Sparkles, MapPin, Search, Cpu, ArrowUpRight, ShieldCheck, Ticket } from 'lucide-react';

const CITIES = ['All Cities', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Goa', 'Hyderabad'];
const CATEGORIES = ['🔥 Hot Drops', '🏟️ Stadium Tours', '🎧 Electronic / Club', '🎤 Hip-Hop / Rap', '🎸 Rock & Indie'];

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('🔥 Hot Drops');
  const [searchQuery, setSearchQuery] = useState('');
  const [archModalOpen, setArchModalOpen] = useState(false);

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

  const filteredEvents = events.filter((ev) => {
    const matchesCity = selectedCity === 'All Cities' || (ev.venue && ev.venue.toLowerCase().includes(selectedCity.toLowerCase()));
    const matchesSearch = !searchQuery || ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-12 py-6">
      {/* ── Architecture Inspector Drawer ── */}
      <ArchitectureModal isOpen={archModalOpen} onClose={() => setArchModalOpen(false)} />

      {/* ── Drop Announcement Ticker ── */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/20 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span className="font-bold uppercase tracking-wider text-purple-300 shrink-0">High-Velocity Drop:</span>
          <span className="text-slate-300 truncate">
            Coldplay: Music of the Spheres Mumbai Phase 3 dropping soon • Diljit Dil-Luminati 96% reserved
          </span>
        </div>

        <button
          onClick={() => setArchModalOpen(true)}
          className="shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono font-medium transition cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Inspect Architecture</span>
          <span className="sm:hidden">Tech</span>
          <ArrowUpRight className="w-3 h-3 opacity-60" />
        </button>
      </div>

      {/* ── Hero Section (Consumer Editorial) ── */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#111320] via-[#0D0F18] to-[#08090E] border border-white/[0.08] p-8 md:p-14 text-center space-y-6 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Ticketing Partner • Verified Passes & Instant Gate QR</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Live the Music. <br />
            <span className="bg-gradient-to-r from-amber-200 via-rose-300 to-purple-400 bg-clip-text text-transparent">
              Zero Queues. Zero Bots.
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Book official stadium concerts, festival passes, and intimate tours with sub-second verified checkout and cryptographic ticket security.
          </p>

          {/* Search bar */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, stadium tours, or venues..."
                className="w-full bg-[#161826] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Value badges */}
        <div className="relative z-10 pt-4 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Scalper Proof-of-Work</span>
          </div>
          <span className="hidden sm:inline text-white/10">•</span>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-400" />
            <span>HMAC-Signed Digital Passes</span>
          </div>
          <span className="hidden sm:inline text-white/10">•</span>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Atomic In-Memory Reservation</span>
          </div>
        </div>
      </section>

      {/* ── Filter Controls ── */}
      <section className="space-y-4">
        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                selectedCity === city
                  ? 'bg-white text-slate-900 border-white font-bold shadow-md'
                  : 'bg-[#121422] text-slate-400 border-white/[0.06] hover:text-white hover:border-white/20'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-white/[0.03] text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Active Drops Grid ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Tour Drops</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredEvents.length} events • Real-time inventory synchronized
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-[#121422] rounded-2xl animate-pulse border border-white/[0.05]" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-[#121422]/60 rounded-3xl border border-white/5 p-8 space-y-2">
            <p className="font-semibold text-white">No events match your search criteria</p>
            <p className="text-xs text-slate-500">Try changing your city or search query filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, idx) => (
              <EventCard key={event.id} event={event} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* ── Platform Trust Footer ── */}
      <section className="rounded-3xl bg-[#111320] border border-white/[0.06] p-8 md:p-10 text-center space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">How FlashPass Guarantees Fairness</h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          Every ticket reservation is protected by cryptographic client-side Proof-of-Work to block bot networks, followed by sub-millisecond atomic Redis allocation to ensure zero double-booking under extreme load.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setArchModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            View Technical Architecture & Prometheus Telemetry
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
