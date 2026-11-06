/**
 * Database migration runner.
 *
 * Dead simple — reads SQL files from the migrations folder and executes
 * them in order. For a real production system you'd want something like
 * node-pg-migrate or Flyway, but this keeps our dependencies lean and
 * is perfectly adequate for a single-migration setup.
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Lexicographic sort ensures 001 runs before 002, etc.

  logger.info(`Found ${files.length} migration(s) to run`);

  const client = await pool.connect();

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);
      await client.query(sql);
      logger.info(`Migration complete: ${file}`);
    }

    logger.info('All migrations applied successfully');
  } catch (err: any) {
    logger.error('Migration failed', { error: err.message, detail: err.detail });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow running directly: `npx ts-node src/database/migrate.ts`
migrate().catch((err) => {
  console.error('Migration script crashed:', err);
  process.exit(1);
});
