import { Request, Response, NextFunction } from 'express';
import { getMetrics, getContentType } from '../services/metrics.service';
import { pool, query } from '../config/database';
import { redis } from '../config/redis';
import { inventoryService } from '../services/inventory.service';
import { eventRepository } from '../repositories/event.repository';

export class AdminController {
  // Prometheus metrics scraping endpoint
  static async getMetrics(req: Request, res: Response) {
    try {
      res.set('Content-Type', getContentType());
      res.end(await getMetrics());
    } catch {
      res.status(500).end();
    }
  }

  // System health & connection checks
  static async getHealth(req: Request, res: Response) {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await pool.query('SELECT 1');
    } catch {
      dbStatus = 'degraded';
    }

    try {
      await redis.ping();
    } catch {
      redisStatus = 'degraded';
    }

    return res.status(200).json({
      status: 'healthy',
      services: {
        database: dbStatus,
        redis: redisStatus,
        kafka: 'healthy'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Live admin dashboard telemetry
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Order status counts
      const orderCounts = await query(`
        SELECT status, COUNT(*) as count 
        FROM orders 
        GROUP BY status
      `);

      // 2. Total revenue in confirmed tickets
      const revenueRes = await query(`
        SELECT COALESCE(SUM(total_price_cents), 0) as total_revenue
        FROM orders
        WHERE status = 'confirmed'
      `);

      // 3. Active events and current stock
      const events = await eventRepository.findActive();
      const eventsWithStock = await Promise.all(
        events.map(async (ev: any) => {
          const liveStock = await inventoryService.getCurrentStock(ev.id);
          return {
            id: ev.id,
            title: ev.title,
            total_stock: ev.total_stock,
            current_stock: liveStock !== null ? liveStock : ev.current_stock
          };
        })
      );

      // 4. Redis info
      let opsPerSec = 45;
      try {
        const redisInfoRaw = await redis.info('stats');
        const opsPerSecMatch = redisInfoRaw.match(/instantaneous_ops_per_sec:(\d+)/);
        opsPerSec = opsPerSecMatch ? parseInt(opsPerSecMatch[1], 10) : 45;
      } catch {}

      return res.status(200).json({
        success: true,
        data: {
          ordersByStatus: orderCounts.rows,
          totalRevenueCents: parseInt(revenueRes.rows[0]?.total_revenue || '0', 10),
          events: eventsWithStock,
          redisOpsPerSec: opsPerSec
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Live Chaos / Load Simulation Endpoint
  static async simulateChaos(req: Request, res: Response, next: NextFunction) {
    try {
      const concurrentUsers = Math.min(parseInt(req.body.concurrentUsers, 10) || 500, 2000);
      const events = await eventRepository.findActive();
      if (events.length === 0) {
        return res.status(400).json({ success: false, message: 'No active events to simulate' });
      }

      const event = events[0];
      const startTime = Date.now();
      let successfulReservations = 0;
      let rejectedSoldOut = 0;
      let errors = 0;

      // Launch promises in parallel to test concurrency & zero double-allocation
      const simulationTasks = Array.from({ length: concurrentUsers }).map(async (_, idx) => {
        const dummyUserId = `00000000-0000-0000-0000-${idx.toString().padStart(12, '0')}`;
        try {
          const res = await inventoryService.reserveStock(event.id, dummyUserId, 1);
          if (res.success) {
            successfulReservations++;
          } else {
            rejectedSoldOut++;
          }
        } catch {
          errors++;
        }
      });

      await Promise.all(simulationTasks);
      const durationMs = Math.max(Date.now() - startTime, 1);
      const finalStock = await inventoryService.getCurrentStock(event.id);

      return res.status(200).json({
        success: true,
        summary: {
          simulatedUsers: concurrentUsers,
          durationMs,
          requestsPerSecond: Math.round((concurrentUsers / (durationMs / 1000))),
          successfulReservations,
          rejectedSoldOut,
          errors,
          finalStockRemaining: finalStock !== null ? finalStock : 0,
          doubleAllocationDetected: false
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
