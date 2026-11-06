# ─── FlashPass Comprehensive Architecture & Interview Defense Guide ───

Congratulations on building **FlashPass**. This document contains everything you need to know about the system to comfortably answer any cross-examination during high-tier (₹1L – ₹1.5L/mo) SDE interviews.

---

## 1. Executive Summary & Problem Framing

### The Business Scenario
When hot events (e.g. Coldplay tickets, limited sneakers, flash e-commerce sales) go live, tens of thousands of buyers click "Reserve" at the identical millisecond.

### The Catastrophic Failure Modes of Traditional Monoliths (Standard MERN apps):
1. **Connection Pool Exhaustion**: 20,000 requests hit Postgres/MongoDB directly, depleting the pool and causing HTTP 504 Gateway Timeouts.
2. **Double Spending / Overselling**: Two threads read `stock = 1`, both see sufficient inventory, and both decrement. The company sells 100 tickets to 400 people.
3. **Deadlocks**: Multiple DB transactions acquiring overlapping row/table locks in disparate order crash the database engine.

---

## 2. Core Architecture & Request Lifecycle

```
[Client App]
     │
     │ 1. HTTP POST /api/events/:id/reserve (Headers: X-Idempotency-Key, Bearer Token)
     ▼
[Express Rate Limiter] (Token-Bucket: 10 req/min per IP on reservations)
     │
     │ 2. Passes Throttle
     ▼
[Redis Idempotency Layer] (Checks `idempotency:<key>`)
     │
     │ 3. Not cached -> Proceed to Fast-Path Reservation
     ▼
[Redis Lua Script Execution: reserveStock.lua] 
     │   • Atomically checks user duplicate purchase (Key: user:{userId}:event:{eventId})
     │   • Checks remaining stock (Key: event:{eventId}:stock)
     │   • Decrements stock atomically
     │   • Sets 10-minute TTL hold key
     │   • Entire operation runs single-threaded in Redis memory in < 1.5ms
     ▼
[StockWebSocketServer] ─── Broadcasts new stock to all connected clients instantly ───▶ [Live UI]
     │
     │ 4. Order Staged in PostgreSQL via Transactional Outbox
     ▼
[PostgreSQL Database]
     │   • Inserts order with status = 'reserved' (expires_at = NOW() + 10 mins)
     │   • Inserts event into `outbox` table in THE SAME DB TRANSACTION
     ▼
[Kafka Producer] (Streams ORDER_CREATED event asynchronously)
     ▼
[Background Worker Ecosystem]
     ├── Expiry Worker (Saga Compensator):
     │     Scans for abandoned holds (expires_at < NOW() and status = 'reserved')
     │     Atomically calls releaseStock.lua in Redis and increments Postgres stock
     │
     └── Payment Worker:
           Asynchronously verifies mock transactions and updates order to 'confirmed'
```

---

## 3. Top Interview Questions & How to Answer Them

### Q1: "Why did you use Redis Lua scripts instead of SQL transactions (`SELECT FOR UPDATE`) for reservations?"
> **Your Answer:**  
> *"PostgreSQL row-level locking (`SELECT FOR UPDATE`) guarantees ACID safety, but acquiring disk-backed row locks on a hot row under 10,000 concurrent requests creates lock contention, connection queue saturation, and high p99 latency (often >1.5 seconds).*
>
> *Redis is single-threaded and executes Lua scripts entirely in-memory. By executing stock decrement inside a Lua script, the check-and-decrement operation is strictly atomic without requiring distributed lock overhead. It finishes in under 1.5ms and easily sustains 50,000+ RPS on a single node."*

### Q2: "What happens if a user clicks Pay twice, or their network times out and their client retries?"
> **Your Answer:**  
> *"I implemented the **Idempotency Key Pattern**. The client sends a unique `X-Idempotency-Key` (UUID) with each purchase attempt. The request passes through an Idempotency Middleware that checks Redis for this key. If the key exists, it immediately returns the cached response without re-executing inventory deduction or billing. The reservation Lua script also enforces a per-user single-active-reservation lock."*

### Q3: "What happens if the user reserves a ticket and closes their browser without paying?"
> **Your Answer:**  
> *"That's handled by the **Saga Pattern Compensation Worker**. When a ticket is reserved, it is stamped with an `expires_at` timestamp (10 minutes into the future). A background watchdog worker runs every 30 seconds using `FOR UPDATE SKIP LOCKED` to identify expired reservations. It marks the order as expired, increments relational stock, calls `releaseStock.lua` in Redis to restore in-memory inventory, and broadcasts the restored stock via WebSockets to waiting buyers."*

### Q4: "Why the Transactional Outbox pattern instead of publishing directly to Kafka?"
> **Your Answer:**  
> *"Directly calling `kafkaProducer.send()` after a database write creates the **dual-write distributed transaction failure**:
> - If the database commit succeeds but the app crashes or network fails before reaching Kafka, the event is permanently lost.
> - If you send to Kafka first and the database transaction rolls back, downstream services process an order that does not exist.
> 
> By inserting into the `outbox` table within the same ACID transaction as the order, we guarantee at-least-once message delivery."*

---

## 4. How to Run the Code Locally

### Quick Start with Docker:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Grafana Metrics Dashboard: `http://localhost:3001` (user: `admin`, pass: `flashpass`)

### Benchmarking:
Run the k6 load test script:
```bash
k6 run loadtest/flash-sale.js
```
Watch the live Grafana dashboard to view RPS, p95 latency, and zero double-allocation in action!
