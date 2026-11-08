import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { OrderReceipt } from '../components/OrderReceipt';
import { Order, Event } from '../types';

export const ConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!orderId) return;
    api.orders.getById(orderId).then((o) => {
      setOrder(o);
      // Try to fetch event details
      const eventId = o.event_id || o.eventId;
      if (eventId) {
        api.events.getById(eventId).then(setEvent).catch(() => {});
      }
    }).catch(console.error);
  }, [orderId]);

  if (!order) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Verifying transaction...</div>;
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
        eventTitle={event?.title}
        eventVenue={event?.venue}
        eventDate={event?.event_date || event?.date}
      />
    </div>
  );
};

export default ConfirmationPage;
