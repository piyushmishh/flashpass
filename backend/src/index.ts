import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { logger } from './utils/logger';
import { pool, query } from './config/database';
import { redis, loadAllLuaScripts } from './config/redis';
import { errorHandler } from './utils/errors';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { httpRequestDuration, httpRequestsTotal } from './services/metrics.service';
import { StockWebSocketServer } from './websocket/stockUpdates';
import { startWorkers } from './workers';

// Route imports
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import orderRoutes, { eventReservationRouter } from './routes/order.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const server = http.createServer(app);

// 1. Security & Core Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// 2. Metrics & Telemetry Middleware (Prometheus)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode.toString() });
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode.toString() }, duration);
  });
  next();
});

// 3. API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/events', eventReservationRouter); // for /api/events/:eventId/reserve
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Root health probe
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Serve frontend SPA build if compiled
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 4. Centralized Error Handler
app.use(errorHandler);

// 5. Initialize WebSocket Server
StockWebSocketServer.init(server);

// 6. Bootstrap Connections & Start Server
async function bootstrap() {
  try {
    // 1. Verify / Probe PostgreSQL (fallback triggers automatically if offline)
    try {
      await pool.query('SELECT 1');
      logger.info('Connected to PostgreSQL database cluster.');
    } catch {
      logger.info('Running with In-Memory Relational Database engine.');
    }

    // 2. Verify / Probe Redis (fallback triggers automatically if offline)
    try {
      await redis.ping();
      loadAllLuaScripts();
      logger.info('Connected to Redis in-memory cache.');
    } catch {
      logger.info('Running with In-Memory Atomic Reservation Engine.');
    }

    // 3. Start background Saga workers alongside API
    startWorkers().catch((err) => logger.debug('Workers initialized in local mode:', err.message));

    server.listen(env.PORT, () => {
      logger.info(`⚡ FlashPass Engine active on http://localhost:${env.PORT}`);
      logger.info(`📊 Prometheus metrics scraped at http://localhost:${env.PORT}/api/admin/metrics`);
      logger.info(`🔌 WebSocket server active on ws://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error('Bootstrap failure:', error);
    process.exit(1);
  }
}

// Graceful termination
const shutdown = async () => {
  logger.info('Terminating FlashPass graceful shutdown...');
  server.close(async () => {
    try {
      await pool.end();
      redis.disconnect();
    } catch {}
    logger.info('Closed DB and Redis connections cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap();
