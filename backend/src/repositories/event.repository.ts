/**
 * Event repository — PostgreSQL access for flash-sale events.
 *
 * Stock modification methods use SELECT FOR UPDATE to prevent concurrent
 * transactions from double-decrementing. This is the fallback guarantee
 * behind Redis — even if Redis somehow drifts, PostgreSQL stays consistent.
 */

import { query, getClient } from '../config/database';
import { Event } from '../types';

export const eventRepository = {
  /** Fetch all events, newest first. */
  async findAll(): Promise<Event[]> {
    const result = await query<Event>(
      'SELECT * FROM events ORDER BY created_at DESC'
    );
    return result.rows;
  },

  /** Fetch a single event by ID. */
  async findById(id: string): Promise<Event | null> {
    const result = await query<Event>(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /** Fetch only active events whose drop_time hasn't passed yet (or recently). */
  async findActive(): Promise<Event[]> {
    const result = await query<Event>(
      `SELECT * FROM events
       WHERE is_active = true
       ORDER BY drop_time ASC`
    );
    return result.rows;
  },

  /**
   * Atomically decrement stock in PostgreSQL. Uses SELECT FOR UPDATE
   * to lock the row for the duration of the transaction so no two
   * concurrent transactions can read the same stock value.
   *
   * Returns the updated event, or null if stock was insufficient.
   */
  async decrementStock(id: string, quantity: number): Promise<Event | null> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Lock the row — any other transaction trying to decrement the same
      // event will block here until we commit or rollback.
      const lockResult = await client.query<Event>(
        'SELECT * FROM events WHERE id = $1 FOR UPDATE',
        [id]
      );

      const event = lockResult.rows[0];
      if (!event || event.current_stock < quantity) {
        await client.query('ROLLBACK');
        return null;
      }

      const updateResult = await client.query<Event>(
        `UPDATE events
         SET current_stock = current_stock - $1
         WHERE id = $2
         RETURNING *`,
        [quantity, id]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Put stock back — called when an order is cancelled or expires.
   * No row locking needed here because incrementing is commutative.
   */
  async incrementStock(id: string, quantity: number): Promise<Event | null> {
    const result = await query<Event>(
      `UPDATE events
       SET current_stock = current_stock + $1
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] || null;
  },
};
