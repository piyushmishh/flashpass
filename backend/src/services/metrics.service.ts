/**
 * Prometheus metrics service.
 * Exposes RED metrics and FlashPass counters for Prometheus and Grafana dashboards.
 */

import client, {
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Collect default Node runtime metrics
collectDefaultMetrics({ prefix: 'flashpass_' });

export const metricsRegister = client.register;

export const httpRequestsTotal = new Counter({
  name: 'flashpass_http_requests_total',
  help: 'Total number of HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'flashpass_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const httpRequestDurationMicroseconds = httpRequestDuration;

export const activeWebSocketConnections = new Gauge({
  name: 'flashpass_active_websocket_connections',
  help: 'Number of currently connected WebSocket clients',
});

export const websocketActiveGauge = activeWebSocketConnections;

export const ordersCreatedTotal = new Counter({
  name: 'flashpass_orders_created_total',
  help: 'Total orders created by status',
  labelNames: ['status'],
});

export const redisOperationsTotal = new Counter({
  name: 'flashpass_redis_operations_total',
  help: 'Total Redis operations executed',
  labelNames: ['operation'],
});

export const kafkaMessagesPublished = new Counter({
  name: 'flashpass_kafka_messages_published',
  help: 'Total events published to Kafka',
  labelNames: ['topic'],
});

export const kafkaConsumerLag = new Gauge({
  name: 'flashpass_kafka_consumer_lag',
  help: 'Estimated consumer lag per topic',
  labelNames: ['topic'],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
}

export async function getMetrics(): Promise<string> {
  return client.register.metrics();
}

export function getContentType(): string {
  return client.register.contentType;
}
