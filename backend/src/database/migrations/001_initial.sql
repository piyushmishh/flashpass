-- FlashPass: Initial database schema
-- This migration sets up the core tables for users, events, orders,
-- and the transactional outbox pattern for reliable event publishing.

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER STATUS ENUM
-- Defined as a PostgreSQL enum so the DB enforces valid transitions.
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'reserved',
            'payment_pending',
            'confirmed',
            'cancelled',
            'expired',
            'refunded'
        );
    END IF;
END
$$;

-- ============================================================
-- EVENTS
-- Represents a flash-sale drop (e.g. a concert).
-- `drop_time` is when tickets become available — the API rejects
-- reservations before this timestamp.
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    venue         VARCHAR(255),
    event_date    TIMESTAMPTZ NOT NULL,
    drop_time     TIMESTAMPTZ NOT NULL,
    total_stock   INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    price_cents   INTEGER NOT NULL,
    image_url     VARCHAR(500),
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- Each row is a reservation attempt. The status column tracks
-- its lifecycle from reserved → confirmed or expired/cancelled.
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
    quantity         INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 2),
    total_price_cents INTEGER NOT NULL,
    status           order_status DEFAULT 'reserved',
    idempotency_key  VARCHAR(255) UNIQUE,
    reserved_at      TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at     TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONAL OUTBOX
-- Ensures we never lose an event even if Kafka is temporarily
-- unavailable. A background poller picks these up and publishes.
-- ============================================================
CREATE TABLE IF NOT EXISTS outbox (
    id             BIGSERIAL PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id   UUID NOT NULL,
    event_type     VARCHAR(50) NOT NULL,
    payload        JSONB NOT NULL,
    published      BOOLEAN DEFAULT false,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Carefully chosen to support our query patterns without over-
-- indexing. The hot queries are: "find user's orders", "find
-- expired reservations", and "find unpublished outbox entries".
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id   ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_outbox_pending    ON outbox(published, created_at);

-- ============================================================
-- SEED DATA
-- Drop a demo event so the system is usable immediately after
-- migration. "Coldplay: Music of the Spheres Tour 2026" with
-- 500 VIP Arena tickets at ₹4,999 each.
-- ============================================================
INSERT INTO events (title, description, venue, event_date, drop_time, total_stock, current_stock, price_cents, image_url, is_active)
VALUES (
    'Coldplay: Music of the Spheres Tour 2026',
    'Experience the magic of Coldplay live! VIP Arena standing tickets with early entry and exclusive merch access.',
    'DY Patil Stadium, Mumbai',
    NOW() + interval '90 days',
    NOW() + interval '2 minutes',
    500,
    500,
    499900,
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
    true
)
ON CONFLICT DO NOTHING;
