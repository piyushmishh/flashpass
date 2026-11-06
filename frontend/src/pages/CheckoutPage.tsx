import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PaymentForm } from '../components/PaymentForm';
import { Order } from '../types';

export const CheckoutPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paying, setPaying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const data = await api.orders.getById(orderId);
        setOrder(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handlePay = async () => {
    if (!orderId) return;
    setPaying(true);
    setErrorMsg(null);
    try {
      await api.orders.confirm(orderId);
      navigate(`/confirmation/${orderId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!orderId) return;
    try {
      await api.orders.cancel(orderId);
      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Loading checkout session...</div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-rose-400">Reservation expired or not found.</div>;
  }

  const totalPriceCents = order.total_price_cents ?? (order.totalAmount ? order.totalAmount * 100 : 499900);

  return (
    <div className="max-w-xl mx-auto py-12">
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          {errorMsg}
        </div>
      )}

      <PaymentForm
        orderId={order.id}
        totalPriceCents={totalPriceCents}
        quantity={order.quantity}
        loading={paying}
        onPay={handlePay}
        onCancel={handleCancel}
        onSuccess={() => navigate(`/confirmation/${order.id}`)}
      />
    </div>
  );
};

export default CheckoutPage;
