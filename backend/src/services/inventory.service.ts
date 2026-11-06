/**
 * Inventory service — THE CORE ENGINE of FlashPass.
 *
 * This is where the magic happens. All stock operations go through Redis
 * first (for speed), with PostgreSQL as the system of record. The Lua
 * scripts ensure atomicity at the Redis level, and the service layer
 * coordinates between the two stores.
 *
 * Why Redis first?
 *   - A flash sale can see 50,000+ requests in the first second after drop.
 *   - PostgreSQL row locking at that scale would cause massive contention.
 *   - Redis EVAL is single-threaded and handles this natively at 100k+ ops/sec.
 *   - We sync back to PostgreSQL after the fact for durability.
 */

import { redis } from '../config/redis';
import { logger } from '../utils/logger';

// Extend the Redis type to include our custom Lua commands.
// ioredis's `defineCommand` dynamically adds these methods at runtime.
declare module 'ioredis' {
  interface Redis {
    reserveStock(
      stockKey: string,
      userKey: string,
      quantity: string,
      maxPerUser: string,
      ttlSeconds: string
    ): Promise<number>;

    releaseStock(
      stockKey: string,
      userKey: string,
      quantity: string
    ): Promise<number>;
  }
}

/** Redis key for an event's available stock counter. */
function stockKey(eventId: string): string {
  return `event:${eventId}:stock`;
}

/** Redis key for a user's reservation flag on a specific event. */
function userReservationKey(userId: string, eventId: string): string {
  return `user:${userId}:event:${eventId}`;
}

export const inventoryService = {
  /**
   * Set the initial stock count in Redis. Called at startup and when
   * syncing from PostgreSQL. This is a simple SET — not atomic with
   * anything else, so only call it during initialization.
   */
  async initializeEventStock(eventId: string, stock: number): Promise<void> {
    await redis.set(stockKey(eventId), stock);
    logger.info(`Stock initialised in Redis`, { eventId, stock });
  },

  /**
   * Attempt to reserve tickets for a user. This executes the reserveStock
   * Lua script which atomically:
   *   1. Checks for an existing reservation
   *   2. Validates available stock
   *   3. Decrements stock
   *   4. Sets a TTL'd reservation flag
   *
   * Returns:
   *   - { success: true, remainingStock } if reservation succeeded
   *   - { success: false, reason: '...' } if it failed
   */
  async reserveStock(
    eventId: string,
    userId: string,
    quantity: number,
    maxPerUser: number = 2,
    ttlSeconds: number = 600
  ): Promise<{ success: boolean; remainingStock?: number; reason?: string }> {
    try {
      const result = await redis.reserveStock(
        stockKey(eventId),
        userReservationKey(userId, eventId),
        quantity.toString(),
        maxPerUser.toString(),
        ttlSeconds.toString()
      );

      if (result === -2) {
        return { success: false, reason: 'You already have a reservation for this event' };
      }

      if (result === -1) {
        return { success: false, reason: 'Sold out — no tickets available' };
      }

      // Positive result = new stock count after reservation
      logger.info('Stock reserved', {
        eventId,
        userId,
        quantity,
        remainingStock: result,
      });

      return { success: true, remainingStock: result };
    } catch (err: any) {
      logger.error('Reserve stock failed', {
        eventId,
        userId,
        error: err.message,
      });
      throw err;
    }
  },

  /**
   * Release tickets back to the pool. Called when an order is cancelled,
   * expires, or payment fails. This is the compensating action in our saga.
   */
  async releaseStock(
    eventId: string,
    userId: string,
    quantity: number
  ): Promise<number> {
    try {
      const newStock = await redis.releaseStock(
        stockKey(eventId),
        userReservationKey(userId, eventId),
        quantity.toString()
      );

      logger.info('Stock released', {
        eventId,
        userId,
        quantity,
        newStock,
      });

      return newStock;
    } catch (err: any) {
      logger.error('Release stock failed', {
        eventId,
        userId,
        error: err.message,
      });
      throw err;
    }
  },

  /**
   * Get the current live stock count from Redis. This is what powers
   * the real-time WebSocket updates.
   */
  async getCurrentStock(eventId: string): Promise<number> {
    const stock = await redis.get(stockKey(eventId));
    return stock ? parseInt(stock, 10) : 0;
  },

  /**
   * Sync stock from PostgreSQL to Redis. Useful after a crash recovery
   * or if Redis data gets corrupted. We read the source of truth (PG)
   * and overwrite whatever Redis has.
   */
  async syncStockToRedis(eventId: string, pgStock: number): Promise<void> {
    await redis.set(stockKey(eventId), pgStock);
    logger.info('Stock synced from PostgreSQL to Redis', {
      eventId,
      stock: pgStock,
    });
  },
};
