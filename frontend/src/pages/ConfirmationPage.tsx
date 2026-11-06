import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { OrderReceipt } from '../components/OrderReceipt';
import { Order } from '../types';

export const ConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    api.orders.getById(orderId).then(setOrder).catch(console.error);
  }, [orderId]);

  if (!order) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Verifying on-chain transaction...</div>;
  }

  const totalPriceCents = order.total_price_cents ?? (order.totalAmount ? order.totalAmount * 100 : 499900);
  const confirmedAt = order.confirmed_at ?? order.confirmedAt;

  return (
    <div className="py-12">
      <OrderReceipt
        orderId={order.id}
        totalPriceCents={totalPriceCents}
        quantity={order.quantity}
        confirmedAt={confirmedAt}
      />
    </div>
  );
};

export default ConfirmationPage;
