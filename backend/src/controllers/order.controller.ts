import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { eventRepository } from '../repositories/event.repository';
import { ticketService } from '../services/ticket.service';
import { pdfService } from '../services/pdf.service';
import { StockWebSocketServer } from '../websocket/stockUpdates';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class OrderController {
  static async reserve(req: any, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const quantity = parseInt(req.body.quantity, 10) || 1;
      const userId = req.user?.id || 'demo-user-id';
      const idempotencyKey = req.header('X-Idempotency-Key') || `idemp-${Date.now()}`;

      const result = await orderService.createReservation(
        userId,
        eventId,
        quantity,
        idempotencyKey
      );

      // Broadcast instant stock depletion to connected WebSockets
      StockWebSocketServer.broadcastStock(eventId, result.remainingStock ?? 0);

      return res.status(201).json({
        success: true,
        message: 'Tickets reserved successfully. Please complete payment within the hold window.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req: any, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id || 'demo-user-id';

      const order = await orderService.confirmOrder(orderId, userId);

      return res.status(200).json({
        success: true,
        message: 'Order confirmed! Your ticket is confirmed.',
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: any, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id || 'demo-user-id';

      const order = await orderService.cancelOrder(orderId, userId);
      return res.status(200).json({
        success: true,
        message: 'Order reservation cancelled and inventory restored.',
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo-user-id';
      const orders = await orderService.getOrdersByUserId(userId);
      return res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: any, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderById(orderId);
      return res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:orderId/ticket
   * Returns a self-contained HTML ticket page with an embedded QR code.
   */
  static async getTicketHTML(req: any, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id || 'demo-user-id';

      const order = await orderService.getOrderById(orderId);

      if (order.user_id !== userId) {
        throw new ForbiddenError('This order belongs to another user');
      }

      const event = await eventRepository.findById(order.event_id);
      if (!event) {
        throw new NotFoundError('Event', order.event_id);
      }

      const qrPayload = ticketService.generateQRPayload(
        order.id,
        order.event_id,
        order.user_id
      );

      const html = pdfService.generateTicketHTML(order, event, qrPayload);

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (error) {
      next(error);
    }
  }
}
