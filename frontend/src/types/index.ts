/* ── Core domain types matching the backend API ──────────────────── */

export interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  role?: 'customer' | 'admin';
  createdAt?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  date?: string;
  event_date?: string;
  dropTime?: string;
  drop_time?: string;
  price?: number;
  price_cents?: number;
  totalStock?: number;
  total_stock?: number;
  currentStock?: number;
  current_stock?: number;
  imageUrl?: string;
  image_url?: string;
  status?: 'upcoming' | 'live' | 'soldout' | 'ended';
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
}

export type OrderStatus =
  | 'reserved'      // ticket locked, awaiting payment
  | 'confirmed'     // payment succeeded
  | 'cancelled'     // user or timeout cancelled
  | 'expired';      // reservation window elapsed

export interface Order {
  id: string;
  userId?: string;
  user_id?: string;
  eventId?: string;
  event_id?: string;
  event?: Event;             // populated on detail endpoints
  quantity: number;
  totalAmount?: number;
  total_price_cents?: number;
  status: OrderStatus;
  reservedAt?: string;
  reserved_at?: string;
  confirmedAt?: string;
  confirmed_at?: string;
  expiresAt?: string;
  expires_at?: string;         // 10 min reservation window
  idempotencyKey?: string;
  idempotency_key?: string;
  createdAt?: string;
  created_at?: string;
}

/* ── WebSocket message types ─────────────────────────────────────── */

export interface StockUpdate {
  type: 'stock_update';
  eventId: string;
  currentStock: number;
  totalStock?: number;
  timestamp: number;
}

export interface ConnectionAck {
  type: 'connection_ack';
  message: string;
}

export type WebSocketMessage = StockUpdate | ConnectionAck;

/* ── Admin / Metrics types ───────────────────────────────────────── */

export interface MetricsSnapshot {
  ordersByStatus: { status: string; count: string }[];
  totalRevenueCents: number;
  events?: {
    id: string;
    title: string;
    total_stock: number;
    current_stock: number;
  }[];
  redisOpsPerSec: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  details?: Record<string, string | number>;
}

export interface SystemHealthResponse {
  status: string;
  services: {
    database: string;
    redis: string;
    kafka: string;
  };
  timestamp?: string;
}

export interface ChaosResult {
  summary: {
    simulatedUsers: number;
    durationMs: number;
    requestsPerSecond: number;
    successfulReservations: number;
    rejectedSoldOut: number;
    errors: number;
    finalStockRemaining: number;
    doubleAllocationDetected: boolean;
  };
}

/* ── API response wrappers ───────────────────────────────────────── */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
