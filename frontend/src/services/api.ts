/**
 * API service layer — thin fetch wrapper with auth token injection.
 * Every function returns the parsed JSON body or throws on error.
 */

import type {
  AuthResponse,
  ChaosResult,
  Event,
  MetricsSnapshot,
  Order,
  SystemHealthResponse,
  User,
} from '@/types';

const BASE_URL = '/api';

/* ── Fetch helper ────────────────────────────────────────────────── */

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('flashpass_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-JSON error responses gracefully
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.error?.message || body.error || body.message || `Request failed (${res.status})`);
  }

  // Some endpoints (204) return no body
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  // Unwrap standard { success: true, data: ... } format if present
  if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

/* ── Auth ─────────────────────────────────────────────────────────── */

export const auth = {
  register: (email: string, password: string, fullName: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => request<User>('/auth/me'),
};

/* ── Events ──────────────────────────────────────────────────────── */

export const events = {
  getAll: () => request<Event[]>('/events'),

  getById: (id: string) => request<Event>(`/events/${id}`),
};

/* ── Orders ──────────────────────────────────────────────────────── */

export const orders = {
  reserve: (eventId: string, quantity: number, idempotencyKey: string) =>
    request<{ order: Order; remainingStock: number }>(`/events/${eventId}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
    }),

  confirm: (orderId: string) =>
    request<{ order: Order }>(`/orders/${orderId}/confirm`, { method: 'POST' }),

  cancel: (orderId: string) =>
    request<{ order: Order }>(`/orders/${orderId}`, { method: 'DELETE' }),

  getMyOrders: () => request<Order[]>('/orders'),

  getById: (orderId: string) => request<Order>(`/orders/${orderId}`),
};

/* ── Admin ────────────────────────────────────────────────────────── */

export const admin = {
  getMetrics: () => request<string>('/admin/metrics'),

  getHealth: () => request<SystemHealthResponse>('/admin/health'),

  getStats: () => request<MetricsSnapshot>('/admin/stats'),

  simulateChaos: (concurrentUsers: number) =>
    request<ChaosResult>('/admin/simulate', {
      method: 'POST',
      body: JSON.stringify({ concurrentUsers }),
    }),
};

export const api = {
  auth,
  events,
  orders,
  admin,
};

export default api;
