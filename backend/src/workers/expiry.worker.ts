import { pool } from '../config/database';
import { inventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';
import { StockWebSocketServer } from '../websocket/stockUpdates';

/**
 * Saga Expiry Worker
 * Scans for reservations that exceeded their 10-minute hold window
 * without completed payment, and returns stock back to the active pool.
 */
export async function runExpiryWorker() {
  logger.info('[Expiry Worker] Started reservation watchdog loop (interval: 30s)');

  setInterval(async () => {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Select reserved orders past their expiry time with pessimistic row locks
        const expiredOrdersRes = await client.query(`
          SELECT id, event_id, user_id, quantity
          FROM orders
          WHERE status = 'reserved' AND expires_at < NOW()
          FOR UPDATE SKIP LOCKED
        `);

        if (expiredOrdersRes.rows.length > 0) {
          logger.info(`[Expiry Worker] Found ${expiredOrdersRes.rows.length} expired reservations to compensate`);

          for (const order of expiredOrdersRes.rows) {
            // 1. Mark as expired in PostgreSQL
            await client.query(
              `UPDATE orders SET status = 'expired' WHERE id = $1`,
              [order.id]
            );

            // 2. Increment relational stock
            await client.query(
              `UPDATE events SET current_stock = current_stock + $1 WHERE id = $2`,
              [order.quantity, order.event_id]
            );

            // 3. Atomically restore Redis stock via Lua
            const newStock = await inventoryService.releaseStock(
              order.event_id,
              order.user_id,
              order.quantity
            );

            // 4. Broadcast live restored stock to connected clients
            StockWebSocketServer.broadcastStock(order.event_id, newStock);
            logger.info(`[Expiry Worker] Compensated order ${order.id}: Restored ${order.quantity} tickets`);
          }
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error('[Expiry Worker] Error processing expired orders:', err);
      } finally {
        client.release();
      }
    } catch (err) {
      // In-memory mode or quiet log
    }
  }, 30000);
}
