/**
 * Navbar — top navigation bar with glassmorphism effect.
 * Shows auth controls, admin link, and scanner link.
 * Includes mobile hamburger menu and slide-down entrance animation.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Ticket, LayoutDashboard, LogOut, User, Menu, X, ScanLine } from 'lucide-react';
import clsx from 'clsx';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Events', icon: Ticket, show: true },
    { to: '/orders', label: 'My Orders', icon: Ticket, show: isAuthenticated },
    { to: '/scanner', label: 'Scanner', icon: ScanLine, show: true },
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, show: user?.role === 'admin' },
  ];

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 inset-x-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ──────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 group">
            <Zap className="w-7 h-7 text-neon-blue group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300" />
            <span className="text-xl font-bold tracking-tight text-gradient">
              FlashPass
            </span>
          </Link>

          {/* ── Desktop nav links ─────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.filter(l => l.show).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'btn-ghost flex items-center gap-1.5 text-sm',
                  isActive(link.to) && 'text-white bg-surface-700/50',
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Auth controls (desktop) ────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-700/40">
                  <User className="w-4 h-4 text-neon-blue" />
                  <span className="text-sm font-medium text-slate-300">
                    {user?.name || user?.fullName || user?.full_name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="btn-ghost flex items-center gap-1.5 text-sm text-slate-400 hover:text-neon-red"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4">
                Sign In
              </Link>
            )}
          </div>

          {/* ── Mobile hamburger ──────────────────────────────── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-700/50 transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu panel ──────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden glass-strong border-t border-surface-700/40"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.filter(l => l.show).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                    isActive(link.to)
                      ? 'text-white bg-surface-700/50'
                      : 'text-slate-400 hover:text-white hover:bg-surface-700/30',
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-surface-700/40 pt-2 mt-2">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                      <User className="w-4 h-4 text-neon-blue" />
                      {user?.name || user?.fullName || user?.full_name}
                    </div>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-neon-red transition w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center py-2.5 btn-primary text-sm"
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
  );
}

export default Navbar;
