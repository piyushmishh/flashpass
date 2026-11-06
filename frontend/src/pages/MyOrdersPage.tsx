import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Order } from '../types';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.orders.getMyOrders();
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CONFIRMED</span>;
      case 'reserved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">HOLD (PAYMENT PENDING)</span>;
      case 'expired':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-400">EXPIRED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">My Drop Passes</h1>
          <p className="text-sm text-slate-400">Ledger of all reserved and confirmed tickets</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 bg-slate-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-800">
          <p className="text-slate-400 text-sm">No passes found yet.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300 font-medium">
            Explore active drops →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const createdAt = order.created_at ?? order.createdAt ?? new Date().toISOString();
            const totalPriceCents = order.total_price_cents ?? (order.totalAmount ? order.totalAmount * 100 : 499900);

            return (
              <div
                key={order.id}
                className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs text-blue-400 font-bold">{order.id.slice(0, 8)}...</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-lg font-bold text-white pt-1">
                    {order.quantity}x VIP Ticket Allocation
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Booked at {new Date(createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-white">
                      ₹{(totalPriceCents / 100).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Total Price</span>
                  </div>

                  {order.status === 'reserved' && (
                    <Link
                      to={`/checkout/${order.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                    >
                      Complete Checkout
                    </Link>
                  )}

                  {order.status === 'confirmed' && (
                    <Link
                      to={`/confirmation/${order.id}`}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition"
                    >
                      View Ticket Pass
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
