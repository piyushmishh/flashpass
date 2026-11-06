import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';
import { activeWebSocketConnections } from '../services/metrics.service';

interface ClientSubscription {
  ws: WebSocket;
  eventId?: string;
  isAlive: boolean;
}

export class StockWebSocketServer {
  private static wss: WebSocketServer;
  private static clients: Set<ClientSubscription> = new Set();

  static init(server: HttpServer) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      const client: ClientSubscription = { ws, isAlive: true };
      this.clients.add(client);
      activeWebSocketConnections.set(this.clients.size);
      logger.info(`[WebSocket] New client connected. Active: ${this.clients.size}`);

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'subscribe' && data.eventId) {
            client.eventId = data.eventId;
            // Send instant initial stock
            const stockKey = `event:${data.eventId}:stock`;
            const currentStock = await redis.get(stockKey);
            if (currentStock !== null) {
              ws.send(JSON.stringify({
                type: 'stock_update',
                eventId: data.eventId,
                currentStock: parseInt(currentStock, 10),
                timestamp: Date.now()
              }));
            }
          }
        } catch (err) {
          logger.warn('[WebSocket] Error parsing client message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(client);
        activeWebSocketConnections.set(this.clients.size);
      });
    });

    // Heartbeat ping interval to clean dead sockets
    setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
      activeWebSocketConnections.set(this.clients.size);
    }, 30000);
  }

  // Instant broadcast on every reservation/release
  static broadcastStock(eventId: string, newStock: number) {
    if (!this.wss) return;
    const payload = JSON.stringify({
      type: 'stock_update',
      eventId,
      currentStock: newStock,
      timestamp: Date.now()
    });

    this.clients.forEach((client) => {
      if (client.eventId === eventId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }
}
