import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { reservationLimiter } from '../middleware/rateLimiter.middleware';
import { enforceIdempotency } from '../middleware/idempotency.middleware';
import { verifyProofOfWork } from '../middleware/pow.middleware';

const router = Router();

// Route 1: Direct reservation via event endpoint
export const eventReservationRouter = Router();
eventReservationRouter.post(
  '/:eventId/reserve',
  authenticateJwt as any,
  reservationLimiter as any,
  enforceIdempotency(600) as any,
  verifyProofOfWork as any,
  OrderController.reserve as any
);

// Order management routes
router.use(authenticateJwt as any);
router.get('/', OrderController.getMyOrders as any);
router.get('/:orderId', OrderController.getById as any);
router.get('/:orderId/ticket', OrderController.getTicketHTML as any);
router.post('/:orderId/confirm', OrderController.confirm as any);
router.delete('/:orderId', OrderController.cancel as any);

export default router;
