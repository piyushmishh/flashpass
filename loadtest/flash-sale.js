// ──────────────────────────────────────────────────────────────
//  FlashPass — k6 Load Test Script
//  Simulates a flash-sale scenario with thousands of concurrent
//  users hitting the reservation endpoint simultaneously.
//
//  Usage:
//    k6 run loadtest/flash-sale.js
//    k6 run --vus 500 --duration 60s loadtest/flash-sale.js
//
//  Prerequisites:
//    - Install k6: https://k6.io/docs/get-started/installation/
//    - Backend must be running on localhost:4000
//    - A seeded event must exist in the database
// ──────────────────────────────────────────────────────────────

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Counter, Trend } from "k6/metrics";

// ─── Custom Metrics ─────────────────────────────────────────
const reservationSuccess = new Rate("reservation_success_rate");
const reservationErrors = new Counter("reservation_errors");
const reservationLatency = new Trend("reservation_latency", true);
const paymentLatency = new Trend("payment_latency", true);

// ─── Test Configuration ─────────────────────────────────────
//
// We ramp up traffic to simulate a real flash-sale:
//   1. Warm-up:  50 users over 10s  (people refreshing the page)
//   2. Spike:    2000 users in 5s   (the drop goes live)
//   3. Sustain:  2000 users for 30s (everyone frantically clicking)
//   4. Cooldown: ramp down over 10s
//
export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 50 },    // warm-up
        { duration: "5s", target: 2000 },   // sudden spike at drop time
        { duration: "30s", target: 2000 },  // sustained peak
        { duration: "10s", target: 0 },     // cooldown
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    // Our SLA targets — the test FAILS if these aren't met
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    reservation_success_rate: ["rate>0.1"],
    reservation_latency: ["p(99)<800"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

// Each virtual user gets a unique identity
let userCounter = 0;

// ─── Setup: Register users and find the active event ────────
export function setup() {
  // Fetch the list of active events to find our target
  const eventsRes = http.get(`${BASE_URL}/api/events`);
  check(eventsRes, {
    "fetched events successfully": (r) => r.status === 200,
  });

  const events = JSON.parse(eventsRes.body);
  if (!events.data || events.data.length === 0) {
    console.error("No active events found! Seed the database first.");
    return { eventId: null };
  }

  const targetEvent = events.data[0];
  console.log(`Target event: "${targetEvent.title}" (${targetEvent.id})`);
  console.log(`Initial stock: ${targetEvent.current_stock}`);

  return {
    eventId: targetEvent.id,
    eventTitle: targetEvent.title,
    initialStock: targetEvent.current_stock,
  };
}

// ─── Main Test Flow ─────────────────────────────────────────
//
// Each virtual user simulates a real customer:
//   1. Register a new account
//   2. Log in to get a JWT token
//   3. View the event page (GET)
//   4. Attempt to reserve tickets (POST — the critical path)
//   5. If reservation succeeds, attempt payment confirmation
//
export default function (data) {
  if (!data.eventId) return;

  const userId = `loadtest_user_${__VU}_${__ITER}_${Date.now()}`;
  const email = `${userId}@loadtest.flashpass.io`;
  const password = "LoadTest2026!";

  let token = null;

  group("1. Register & Authenticate", () => {
    // Register
    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email: email,
        password: password,
        fullName: `Load Tester ${__VU}`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    if (registerRes.status === 201 || registerRes.status === 200) {
      const body = JSON.parse(registerRes.body);
      token = body.data?.token;
    }

    // If registration failed (email already exists), try logging in
    if (!token) {
      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email, password }),
        { headers: { "Content-Type": "application/json" } }
      );
      if (loginRes.status === 200) {
        const body = JSON.parse(loginRes.body);
        token = body.data?.token;
      }
    }
  });

  if (!token) {
    reservationErrors.add(1);
    return; // Can't proceed without authentication
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  group("2. Browse Event", () => {
    const eventRes = http.get(`${BASE_URL}/api/events/${data.eventId}`, {
      headers: authHeaders,
    });
    check(eventRes, {
      "event page loaded": (r) => r.status === 200,
    });
  });

  // Small random delay to simulate human reaction time (50-200ms)
  sleep(Math.random() * 0.15 + 0.05);

  group("3. Reserve Tickets (Critical Path)", () => {
    const idempotencyKey = `${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;

    const startTime = Date.now();

    const reserveRes = http.post(
      `${BASE_URL}/api/events/${data.eventId}/reserve`,
      JSON.stringify({ quantity: 1 }),
      {
        headers: {
          ...authHeaders,
          "X-Idempotency-Key": idempotencyKey,
        },
      }
    );

    const latency = Date.now() - startTime;
    reservationLatency.add(latency);

    const success = reserveRes.status === 201;
    reservationSuccess.add(success);

    check(reserveRes, {
      "reservation accepted (201) or sold out (409)": (r) =>
        r.status === 201 || r.status === 409,
      "no server errors": (r) => r.status < 500,
    });

    if (!success) {
      if (reserveRes.status === 409) {
        // Sold out — this is expected behavior under load
        return;
      }
      reservationErrors.add(1);
      return;
    }

    // If reservation succeeded, try to confirm payment
    const body = JSON.parse(reserveRes.body);
    const orderId = body.data?.order?.id;

    if (orderId) {
      sleep(Math.random() * 0.5 + 0.1); // Simulate user reviewing checkout

      group("4. Confirm Payment", () => {
        const payStart = Date.now();

        const confirmRes = http.post(
          `${BASE_URL}/api/orders/${orderId}/confirm`,
          JSON.stringify({}),
          { headers: authHeaders }
        );

        paymentLatency.add(Date.now() - payStart);

        check(confirmRes, {
          "payment processed": (r) =>
            r.status === 200 || r.status === 402 || r.status === 408,
        });
      });
    }
  });

  // Brief pause between iterations
  sleep(Math.random() * 0.3);
}

// ─── Teardown: Print Summary ────────────────────────────────
export function teardown(data) {
  console.log("═══════════════════════════════════════════");
  console.log("  FlashPass Load Test Complete");
  console.log(`  Event: ${data.eventTitle}`);
  console.log(`  Initial Stock: ${data.initialStock}`);
  console.log("═══════════════════════════════════════════");
}
