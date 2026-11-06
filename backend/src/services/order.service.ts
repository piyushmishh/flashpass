/**
 * Order service — orchestrates the full reservation → payment → confirmation flow.
 *
 * This is where the saga pattern comes together. A reservation is a two-phase
 * operation:
 *   1. Reserve stock in Redis (fast, optimistic)
 *   2. Persist the order in PostgreSQL with an outbox event (durable)
 *
 * If step 2 fails, we compensate by releasing stock in Redis. The outbox
 * event triggers the payment pipeline via Kafka.
 */

import { v4 as uuidv4 } from 'uuid';
import { orderRepository } from '../repositories/order.repository';
import { eventRepository } from '../repositories/event.repository';
import { inventoryService } from './inventory.service';
import { paymentService } from './payment.service';
import { env } from '../config/env';
import { Order, OrderStatus, ReservationResult } from '../types';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { getProducer, TOPICS } from '../config/kafka';

export const orderService = {
  /**
   * Create a new ticket reservation. This is the hot path — the endpoint
   * that thousands of users hit simultaneously at drop time.
   *
   * Flow:
   *   1. Validate the event exists and is droppable
   *   2. Check idempotency key for duplicate requests
   *   3. Reserve stock atomically via Redis Lua script
   *   4. If Redis succeeds, persist order + outbox event in PostgreSQL
   *   5. If PostgreSQL fails, compensate by releasing Redis stock
   *   6. Publish order event to Kafka for async payment processing
   */
  async createReservation(
    userId: string,
    eventId: string,
    quantity: number,
    idempotencyKey?: string
  ): Promise<ReservationResult> {
    // Step 1: Validate quantity
    if (quantity < 1 || quantity > env.MAX_TICKETS_PER_USER) {
      throw new ValidationError(
        `Quantity must be between 1 and ${env.MAX_TICKETS_PER_USER}`
      );
    }

    // Step 2: Check idempotency — if the client retries with the same key,
    // return the existing order instead of creating a duplicate
    if (idempotencyKey) {
      const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        logger.info('Idempotent request — returning existing order', {
          orderId: existing.id,
          idempotencyKey,
        });
        return { success: true, order: existing };
      }
    }

    // Step 3: Verify the event exists and is active
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event', eventId);
    }
    if (!event.is_active) {
      throw new ValidationError('This event is no longer active');
    }

    // Step 4: Reserve stock in Redis — this is the atomic fast path
    const reservation = await inventoryService.reserveStock(
      eventId,
      userId,
      quantity,
      env.MAX_TICKETS_PER_USER,
      env.RESERVATION_TTL_SECONDS
    );

    if (!reservation.success) {
      return {
        success: false,
        reason: reservation.reason,
        remainingStock: reservation.remainingStock,
      };
    }

    // Step 5: Persist to PostgreSQL with outbox event — wrapped in a try/catch
    // so we can compensate (release stock) if the DB write fails.
    try {
      const expiresAt = new Date(
        Date.now() + env.RESERVATION_TTL_SECONDS * 1000
      );

      const order = await orderRepository.createWithOutbox(
        {
          user_id: userId,
          event_id: eventId,
          quantity,
          total_price_cents: event.price_cents * quantity,
          status: OrderStatus.RESERVED,
          idempotency_key: idempotencyKey || uuidv4(),
          expires_at: expiresAt,
        },
        {
          aggregate_type: 'order',
          aggregate_id: eventId, // placeholder — overwritten by repo
          event_type: 'ORDER_CREATED',
          payload: {
            userId,
            eventId,
            quantity,
            totalPriceCents: event.price_cents * quantity,
          },
          published: false,
        }
      );

      // Also decrement PostgreSQL stock to keep it roughly in sync
      // (Redis is authoritative for real-time, PG for persistence)
      await eventRepository.decrementStock(eventId, quantity);

      // Step 6: Publish to Kafka for the payment pipeline
      try {
        const producer = await getProducer();
        await producer.send({
          topic: TOPICS.ORDER_EVENTS,
          messages: [
            {
              key: order.id,
              value: JSON.stringify({
                type: 'ORDER_CREATED',
                orderId: order.id,
                userId,
                eventId,
                quantity,
                totalPriceCents: event.price_cents * quantity,
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        });
      } catch (kafkaErr: any) {
        // Kafka publish failure is NOT fatal — the outbox poller will pick
        // it up eventually. Log and move on.
        logger.warn('Kafka publish failed, outbox will retry', {
          orderId: order.id,
          error: kafkaErr.message,
        });
      }

      logger.info('Reservation created', {
        orderId: order.id,
        userId,
        eventId,
        quantity,
        remainingStock: reservation.remainingStock,
      });

      return {
        success: true,
        order,
        remainingStock: reservation.remainingStock,
      };
    } catch (err: any) {
      // COMPENSATION: The DB write failed, so we need to put the tickets back
      logger.error('PostgreSQL write failed, compensating Redis stock', {
        eventId,
        userId,
        error: err.message,
      });
      await inventoryService.releaseStock(eventId, userId, quantity);
      throw err;
    }
  },

  /**
   * Confirm an order — process mock payment and update status.
   * In a real system this would integrate with Stripe/Razorpay.
   */
  async confirmOrder(orderId: string, userId: string): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError('This order belongs to another user');
    }

    if (order.status !== OrderStatus.RESERVED) {
      throw new ConflictError(
        `Cannot confirm order with status '${order.status}'`
      );
    }

    // Check if reservation has expired
    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      throw new ConflictError('Reservation has expired — please try again');
    }

    // Process mock payment
    const paymentResult = await paymentService.processPayment(
      orderId,
      order.total_price_cents
    );

    if (!paymentResult.success) {
      // Payment failed — release the tickets and cancel the order
      await inventoryService.releaseStock(
        order.event_id,
        order.user_id,
        order.quantity
      );
      await eventRepository.incrementStock(order.event_id, order.quantity);
      await orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);

      throw new ConflictError(`Payment failed: ${paymentResult.error}`);
    }

    // Payment succeeded — confirm the order
    const confirmed = await orderRepository.updateStatus(
      orderId,
      OrderStatus.CONFIRMED
    );

    logger.info('Order confirmed', {
      orderId,
      transactionId: paymentResult.transactionId,
    });

    return confirmed!;
  },

  /**
   * Cancel an order — release the reserved stock and update status.
   * Only the owning user can cancel their own order.
   */
  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError('This order belongs to another user');
    }

    // Can only cancel reserved or payment_pending orders
    if (
      order.status !== OrderStatus.RESERVED &&
      order.status !== OrderStatus.PAYMENT_PENDING
    ) {
      throw new ConflictError(
        `Cannot cancel order with status '${order.status}'`
      );
    }

    // Release stock back to the pool
    await inventoryService.releaseStock(
      order.event_id,
      order.user_id,
      order.quantity
    );
    await eventRepository.incrementStock(order.event_id, order.quantity);

    const cancelled = await orderRepository.updateStatus(
      orderId,
      OrderStatus.CANCELLED
    );

    logger.info('Order cancelled', { orderId, userId });

    return cancelled!;
  },

  async getOrderById(orderId: string): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }
    return order;
  },

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return orderRepository.findByUserId(userId);
  },
};
