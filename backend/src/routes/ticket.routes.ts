/**
 * Ticket routes — QR payload generation and gate-scanning verification.
 *
 * POST /api/tickets/verify — scan a ticket QR payload (no auth required for gate scanners)
 * GET  /api/tickets/:orderId/qr-data — get the QR payload for an order (requires auth)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { orderService } from '../services/order.service';
import { authenticateJwt } from '../middleware/auth.middleware';
import { ForbiddenError, ValidationError } from '../utils/errors';

const router = Router();

/**
 * POST /api/tickets/verify
 * Body: { payload: string }
 *
 * Used by gate scanners to verify a ticket. If valid, automatically marks
 * the ticket as scanned to prevent re-entry.
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payload } = req.body;

    if (!payload || typeof payload !== 'string') {
      throw new ValidationError('Missing or invalid "payload" in request body');
    }

    const result = await ticketService.verifyTicket(payload);

    // If valid, auto-mark as scanned
    if (result.valid && result.orderId) {
      await ticketService.markScanned(result.orderId);
    }

    return res.status(result.valid ? 200 : 400).json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tickets/:orderId/qr-data
 *
 * Returns the QR payload for a confirmed order. Requires authentication
 * and the requesting user must own the order.
 */
router.get(
  '/:orderId/qr-data',
  authenticateJwt as any,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id || 'demo-user-id';

      const order = await orderService.getOrderById(orderId);

      if (order.user_id !== userId) {
        throw new ForbiddenError('This order belongs to another user');
      }

      const qrPayload = ticketService.generateQRPayload(
        order.id,
        order.event_id,
        order.user_id
      );

      return res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          qrPayload,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
