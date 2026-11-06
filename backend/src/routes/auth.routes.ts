import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register as any);
router.post('/login', AuthController.login as any);
router.get('/me', authenticateJwt as any, AuthController.me as any);

export default router;
