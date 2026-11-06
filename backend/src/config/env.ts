/**
 * Environment configuration loader.
 *
 * Reads from process.env and provides sensible defaults for local dev. In
 * production every value should be set explicitly — the defaults here just
 * keep the "git clone → npm run dev" experience frictionless.
 */

import dotenv from 'dotenv';

// Load .env before anything else touches process.env
dotenv.config();

function requiredInProd(key: string, fallback: string): string {
  const val = process.env[key] || fallback;
  if (process.env.NODE_ENV === 'production' && !process.env[key]) {
    console.warn(`[config] WARNING: ${key} is using a default value in production!`);
  }
  return val;
}

export const env = {
  // General
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),

  // PostgreSQL
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'flashpass',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // Convenience getter for building a full connection string if needed
  get DB_URL(): string {
    return (
      process.env.DATABASE_URL ||
      `postgresql://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`
    );
  },

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // Kafka
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'flashpass-backend',

  // Auth
  JWT_SECRET: requiredInProd('JWT_SECRET', 'flashpass-dev-secret-change-me'),
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

  // Business rules
  RESERVATION_TTL_SECONDS: parseInt(process.env.RESERVATION_TTL_SECONDS || '600', 10), // 10 min
  MAX_TICKETS_PER_USER: parseInt(process.env.MAX_TICKETS_PER_USER || '2', 10),
} as const;
