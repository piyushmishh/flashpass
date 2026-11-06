/**
 * Core domain types for FlashPass.
 *
 * These interfaces model the essential entities in our flash-sale system:
 * users, events, orders, and the data contracts that flow between layers.
 */

// -- User --

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: Date;
}

/** What we actually send back over the wire — no password hash, obviously. */
export interface UserDTO {
  id: string;
  email: string;
  full_name: string;
  created_at: Date;
}

// -- Event --

export interface Event {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  event_date: Date;
  drop_time: Date;
  total_stock: number;
  current_stock: number;
  price_cents: number;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
}

/**
 * A "drop event" is an Event that also carries the live stock count straight
 * from Redis, so the frontend gets the real-time number rather than a
 * potentially-stale PostgreSQL value.
 */
export interface DropEvent extends Event {
  live_stock: number;
}

// -- Order --

/**
 * Order status follows a strict state machine:
 *
 *   RESERVED ──> PAYMENT_PENDING ──> CONFIRMED
 *       │              │
 *       ▼              ▼
 *    EXPIRED       CANCELLED
 *                     │
 *                     ▼
 *                  REFUNDED
 *
 * Transitions are enforced at the service layer, not here — these are just
 * the valid states the DB and API can represent.
 */
export enum OrderStatus {
  RESERVED = 'reserved',
  PAYMENT_PENDING = 'payment_pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export interface Order {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  total_price_cents: number;
  status: OrderStatus;
  idempotency_key: string | null;
  reserved_at: Date;
  confirmed_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

// -- Outbox (for the transactional outbox pattern) --

export interface OutboxEvent {
  id?: number;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  published: boolean;
  created_at?: Date;
}

// -- Service-layer result types --

export interface ReservationResult {
  success: boolean;
  order?: Order;
  reason?: string;
  remainingStock?: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Snapshot of key system metrics, used by the admin stats endpoint to give
 * operators a quick picture of what's happening right now.
 */
export interface MetricsSnapshot {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  activeEvents: number;
  connectedClients: number;
  redisConnected: boolean;
  kafkaConnected: boolean;
  uptimeSeconds: number;
}

// -- Express request augmentation --

/**
 * We stuff the authenticated user's info onto req so downstream handlers
 * can access it without re-parsing the token. This extends the standard
 * Express Request type.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      idempotencyKey?: string;
    }
  }
}
