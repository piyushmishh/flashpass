/**
 * Mock payment processor.
 *
 * In production this would be Razorpay, Stripe, or a bank gateway. For
 * demo purposes we simulate realistic behaviour:
 *   - 85% of payments succeed instantly
 *   - 10% fail (insufficient funds, card declined, etc.)
 *   - 5% "time out" (simulates gateway latency)
 *
 * The randomness is intentional — it lets us test the full compensation
 * flow (stock release on failure) without needing a real gateway.
 */

import { v4 as uuidv4 } from 'uuid';
import { PaymentResult } from '../types';
import { logger } from '../utils/logger';

export const paymentService = {
  /**
   * Process a payment for the given order.
   *
   * @param orderId - The order being paid for (for logging/correlation)
   * @param amountCents - Amount in paise/cents
   * @returns PaymentResult with success status and either a transaction ID or error
   */
  async processPayment(
    orderId: string,
    amountCents: number
  ): Promise<PaymentResult> {
    logger.info('Processing payment', { orderId, amountCents });

    // Simulate some gateway latency — real gateways take 500ms-3s
    const latency = 200 + Math.random() * 800;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const roll = Math.random();

    // 85% success rate
    if (roll < 0.85) {
      const transactionId = `txn_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
      logger.info('Payment successful', { orderId, transactionId, amountCents });

      return {
        success: true,
        transactionId,
      };
    }

    // 10% failure (declined card, insufficient balance, etc.)
    if (roll < 0.95) {
      const failureReasons = [
        'Insufficient funds',
        'Card declined by issuing bank',
        'CVV verification failed',
        'Transaction limit exceeded',
      ];
      const reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
      logger.warn('Payment failed', { orderId, reason });

      return {
        success: false,
        error: reason,
      };
    }

    // 5% timeout — simulates a flaky gateway
    logger.warn('Payment gateway timeout', { orderId });
    return {
      success: false,
      error: 'Payment gateway timed out — please retry',
    };
  },
};
