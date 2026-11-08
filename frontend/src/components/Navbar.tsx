/**
 * Navbar — top navigation bar with glassmorphism effect.
 * Shows auth controls, admin link, scanner link, and Architecture drawer toggle.
 * Includes mobile hamburger menu and slide-down entrance animation.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ArchitectureModal } from './ArchitectureModal';
import { Zap, Ticket, LayoutDashboard, LogOut, User, Menu, X, ScanLine, Cpu } from 'lucide-react';
import clsx from 'clsx';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [archModalOpen, setArchModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Tours & Drops', icon: Ticket, show: true },
    { to: '/orders', label: 'My Passes', icon: Ticket, show: isAuthenticated },
    { to: '/scanner', label: 'Gate Scanner', icon: ScanLine, show: true },
    { to: '/admin', label: 'Admin Telemetry', icon: LayoutDashboard, show: true },
  ];

  return (
    <>
      <ArchitectureModal isOpen={archModalOpen} onClose={() => setArchModalOpen(false)} />

      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 inset-x-0 z-40 bg-[#090A10]/85 backdrop-blur-xl border-b border-white/[0.08]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-purple-400 fill-purple-400/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-tight">
                  Flash<span className="text-purple-400">Pass</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 -mt-0.5">
                  Live Drops
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks
                .filter((l) => l.show)
                .map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={clsx(
                      'px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition',
                      isActive(link.to)
                        ? 'text-white bg-white/10 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]',
                    )}
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </Link>
                ))}

              {/* Architecture Inspector Button */}
              <button
                onClick={() => setArchModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition cursor-pointer ml-1"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Architecture</span>
              </button>
            </div>

            {/* ── Auth Controls ── */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161826] border border-white/5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {user?.name || user?.fullName || user?.full_name || 'Passholder'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/25"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden bg-[#0C0E17] border-t border-white/[0.08]"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks
                  .filter((l) => l.show)
                  .map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition',
                        isActive(link.to)
                          ? 'text-white bg-white/10'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03]',
                      )}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setArchModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 w-full"
                >
                  <Cpu className="w-4 h-4" />
                  Inspect Architecture
                </button>

                <div className="border-t border-white/[0.08] pt-3 mt-2">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        {user?.name || user?.fullName || user?.full_name}
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-rose-400 font-semibold w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block text-center py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

export default Navbar;
