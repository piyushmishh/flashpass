import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.get('/metrics', AdminController.getMetrics);
router.get('/health', AdminController.getHealth);
router.get('/stats', AdminController.getStats);
router.post('/simulate', AdminController.simulateChaos);

export default router;
