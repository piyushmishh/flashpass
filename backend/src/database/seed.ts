/**
 * Seed script — populates the database with a demo event and syncs its
 * stock count into Redis so the system is ready to demo immediately.
 *
 * Idempotent: safe to run multiple times. The SQL uses ON CONFLICT DO NOTHING
 * and the Redis SET is an overwrite.
 */

import { pool, query } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

async function seed(): Promise<void> {
  try {
    // Check if we already have events — skip seeding if so
    const existing = await query('SELECT id, title, current_stock FROM events LIMIT 10');

    if (existing.rowCount === 0) {
      logger.info('No events found, inserting demo event...');

      const result = await query(
        `INSERT INTO events (title, description, venue, event_date, drop_time, total_stock, current_stock, price_cents, image_url, is_active)
         VALUES ($1, $2, $3, NOW() + interval '90 days', NOW() + interval '2 minutes', $4, $4, $5, $6, true)
         RETURNING id, title, current_stock`,
        [
          'Coldplay: Music of the Spheres Tour 2026',
          'Experience the magic of Coldplay live! VIP Arena standing tickets with early entry and exclusive merch access.',
          'DY Patil Stadium, Mumbai',
          500,
          499900,
          'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
        ]
      );

      const event = result.rows[0];
      logger.info(`Demo event created: ${event.title} (${event.id})`);

      // Pre-load stock into Redis
      await redis.set(`event:${event.id}:stock`, event.current_stock);
      logger.info(`Redis stock initialised for event ${event.id}: ${event.current_stock} tickets`);
    } else {
      // Events exist — just make sure their stock is synced to Redis
      for (const event of existing.rows) {
        await redis.set(`event:${event.id}:stock`, event.current_stock);
        logger.info(`Redis stock synced for "${event.title}": ${event.current_stock} tickets`);
      }
    }

    logger.info('Seed complete');
  } catch (err: any) {
    logger.error('Seed failed', { error: err.message });
    process.exit(1);
  } finally {
    await pool.end();
    redis.disconnect();
  }
}

seed().catch((err) => {
  console.error('Seed script crashed:', err);
  process.exit(1);
});
