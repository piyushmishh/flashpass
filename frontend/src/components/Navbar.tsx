/**
 * Navbar — top navigation bar with glassmorphism effect.
 * Shows auth controls and admin link for privileged users.
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Ticket, LayoutDashboard, LogOut, User } from 'lucide-react';
import clsx from 'clsx';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ──────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 group">
            <Zap className="w-7 h-7 text-neon-blue group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300" />
            <span className="text-xl font-bold tracking-tight text-gradient">
              FlashPass
            </span>
          </Link>

          {/* ── Nav links ─────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={clsx(
                'btn-ghost flex items-center gap-1.5 text-sm',
                isActive('/') && 'text-white bg-surface-700/50',
              )}
            >
              <Ticket className="w-4 h-4" />
              Events
            </Link>

            {isAuthenticated && (
              <Link
                to="/orders"
                className={clsx(
                  'btn-ghost flex items-center gap-1.5 text-sm',
                  isActive('/orders') && 'text-white bg-surface-700/50',
                )}
              >
                <Ticket className="w-4 h-4" />
                My Orders
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={clsx(
                  'btn-ghost flex items-center gap-1.5 text-sm',
                  isActive('/admin') && 'text-white bg-surface-700/50',
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </div>

          {/* ── Auth controls ─────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-700/40">
                  <User className="w-4 h-4 text-neon-blue" />
                  <span className="text-sm font-medium text-slate-300">
                    {user?.name}
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
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
