/**
 * useWebSocket — connects to the stock-update WebSocket.
 *
 * Subscribes to a specific eventId and returns real-time stock numbers.
 * Implements auto-reconnect with exponential backoff so the connection
 * is resilient to transient network blips.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebSocketResult {
  currentStock: number | null;
  totalStock: number | null;
  isConnected: boolean;
  latency: number;           // round-trip time of last pong/message
}

const WS_URL = 'ws://localhost:4000';
const MAX_BACKOFF_MS = 16_000;

export function useWebSocket(eventId: string | undefined): UseWebSocketResult {
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [totalStock, setTotalStock] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const lastPingRef = useRef<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!eventId) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      backoffRef.current = 1000; // reset backoff on successful connect

      // Subscribe to stock updates for this event
      ws.send(JSON.stringify({ type: 'subscribe', eventId }));

      // Start a simple latency ping
      lastPingRef.current = Date.now();
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'pong' || data.type === 'connection_ack') {
          setLatency(Date.now() - lastPingRef.current);
        }

        if (data.type === 'stock_update' && data.eventId === eventId) {
          setCurrentStock(data.currentStock);
          setTotalStock(data.totalStock);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;

      // Exponential backoff reconnect
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror, which handles reconnect
      ws.close();
    };
  }, [eventId]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount or eventId change
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { currentStock, totalStock, isConnected, latency };
}
