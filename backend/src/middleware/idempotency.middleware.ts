import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Idempotency Middleware using Redis
 * Solves the duplicate-order crisis when users double click 'Pay'
 * or network retries re-send the same reservation request.
 */
export const enforceIdempotency = (ttlSeconds: number = 600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('X-Idempotency-Key');
    if (!key) {
      return next();
    }

    const redisKey = `idempotency:${key}`;
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        logger.info(`[Idempotency] Returning cached response for key: ${key}`);
        const parsed = JSON.parse(cached);
        return res.status(parsed.status).json(parsed.body);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          redis.set(
            redisKey,
            JSON.stringify({ status: res.statusCode, body }),
            'EX',
            ttlSeconds
          ).catch((err: any) => logger.error('[Idempotency] Cache save error:', err));
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('[Idempotency] Middleware Redis error:', error);
      next();
    }
  };
};
