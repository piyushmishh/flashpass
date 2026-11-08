/**
 * Ticket service — HMAC-based ticket signing, QR payload generation, and
 * ticket verification for gate scanning.
 *
 * Uses HMAC-SHA256 with the JWT_SECRET as the signing key. This gives us
 * tamper-proof ticket signatures without needing asymmetric crypto.
 */

import crypto from 'crypto';
import { env } from '../config/env';
import { orderRepository } from '../repositories/order.repository';
import { OrderStatus } from '../types';

/** In-memory set of scanned order IDs (would be Redis/DB in production). */
const scannedOrders = new Set<string>();

export const ticketService = {
  /**
   * Create an HMAC-SHA256 signature for a ticket.
   * The signed payload is `orderId:eventId:userId`.
   */
  signTicket(orderId: string, eventId: string, userId: string): string {
    const data = `${orderId}:${eventId}:${userId}`;
    return crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(data)
      .digest('hex');
  },

  /**
   * Generate a JSON payload suitable for encoding into a QR code.
   * Contains the order details plus the HMAC signature for verification.
   */
  generateQRPayload(orderId: string, eventId: string, userId: string): string {
    const sig = this.signTicket(orderId, eventId, userId);
    return JSON.stringify({ orderId, eventId, userId, sig });
  },

  /**
   * Verify a scanned ticket payload.
   *
   * Checks:
   *   1. JSON is well-formed and contains all required fields
   *   2. HMAC signature matches (ticket hasn't been tampered with)
   *   3. Order exists and is in 'confirmed' status
   *   4. Ticket hasn't already been scanned (prevents re-entry)
   */
  async verifyTicket(
    payload: string
  ): Promise<{ valid: boolean; orderId?: string; reason?: string }> {
    let parsed: { orderId?: string; eventId?: string; userId?: string; sig?: string };

    try {
      parsed = JSON.parse(payload);
    } catch {
      return { valid: false, reason: 'Invalid payload format' };
    }

    const { orderId, eventId, userId, sig } = parsed;

    if (!orderId || !eventId || !userId || !sig) {
      return { valid: false, reason: 'Missing required fields in payload' };
    }

    // Re-compute the HMAC and compare
    const expectedSig = this.signTicket(orderId, eventId, userId);
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: false, orderId, reason: 'Invalid signature' };
    }

    // Verify the order exists and is confirmed
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return { valid: false, orderId, reason: 'Order not found' };
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      return {
        valid: false,
        orderId,
        reason: `Order is not confirmed (status: ${order.status})`,
      };
    }

    // Check if already scanned
    if (scannedOrders.has(orderId)) {
      return { valid: false, orderId, reason: 'Ticket already scanned' };
    }

    return { valid: true, orderId };
  },

  /**
   * Mark a ticket as scanned so it can't be used again.
   */
  async markScanned(orderId: string): Promise<void> {
    scannedOrders.add(orderId);
  },

  /**
   * Check whether an order has been scanned (for testing/admin use).
   */
  isScanned(orderId: string): boolean {
    return scannedOrders.has(orderId);
  },
};
