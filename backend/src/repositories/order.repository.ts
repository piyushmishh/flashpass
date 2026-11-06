/**
 * Order repository — the most complex repository because orders touch
 * both the orders table AND the outbox table transactionally.
 *
 * The transactional outbox pattern guarantees that we never create an order
 * without also queuing the corresponding event for Kafka publishing. This
 * is critical in a distributed system — without it, we'd have orders that
 * never trigger payment processing.
 */

import { query, getClient } from '../config/database';
import { Order, OrderStatus, OutboxEvent } from '../types';

export const orderRepository = {
  /** Insert a new order. For simple cases where we don't need the outbox. */
  async create(order: Partial<Order>): Promise<Order> {
    const result = await query<Order>(
      `INSERT INTO orders (user_id, event_id, quantity, total_price_cents, status, idempotency_key, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        order.user_id,
        order.event_id,
        order.quantity,
        order.total_price_cents,
        order.status || OrderStatus.RESERVED,
        order.idempotency_key,
        order.expires_at,
      ]
    );
    return result.rows[0];
  },

  /**
   * Create an order AND an outbox event in a single transaction.
   *
   * This is the bread and butter of the transactional outbox pattern:
   * the order and the "ORDER_CREATED" event are committed atomically,
   * so a background worker can pick up the outbox entry and publish
   * it to Kafka without worrying about data loss.
   */
  async createWithOutbox(
    order: Partial<Order>,
    outboxEvent: Omit<OutboxEvent, 'id' | 'created_at'>
  ): Promise<Order> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Insert the order
      const orderResult = await client.query<Order>(
        `INSERT INTO orders (user_id, event_id, quantity, total_price_cents, status, idempotency_key, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          order.user_id,
          order.event_id,
          order.quantity,
          order.total_price_cents,
          order.status || OrderStatus.RESERVED,
          order.idempotency_key,
          order.expires_at,
        ]
      );

      const createdOrder = orderResult.rows[0];

      // Insert the outbox event — same transaction, so either both succeed
      // or neither does.
      await client.query(
        `INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload, published)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          outboxEvent.aggregate_type,
          createdOrder.id, // use the actual order ID as aggregate_id
          outboxEvent.event_type,
          JSON.stringify(outboxEvent.payload),
          false,
        ]
      );

      await client.query('COMMIT');
      return createdOrder;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<Order | null> {
    const result = await query<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<Order[]> {
    const result = await query<Order>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  /** Check for duplicate requests using the idempotency key. */
  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const result = await query<Order>(
      'SELECT * FROM orders WHERE idempotency_key = $1',
      [key]
    );
    return result.rows[0] || null;
  },

  /** Update order status and optionally set confirmed_at timestamp. */
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const confirmedAt = status === OrderStatus.CONFIRMED ? 'NOW()' : 'confirmed_at';

    const result = await query<Order>(
      `UPDATE orders
       SET status = $1, confirmed_at = ${confirmedAt}
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find all reservations that have expired — these are orders where the
   * user grabbed tickets but never completed payment before the TTL elapsed.
   * The expiry worker picks these up every 30 seconds.
   */
  async findExpiredReservations(): Promise<Order[]> {
    const result = await query<Order>(
      `SELECT * FROM orders
       WHERE status = 'reserved'
         AND expires_at IS NOT NULL
         AND expires_at < NOW()
       LIMIT 100`  // Process in batches to avoid locking too many rows
    );
    return result.rows;
  },
};
