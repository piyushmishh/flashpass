import { Router } from 'express';
import { EventController } from '../controllers/event.controller';

const router = Router();

router.get('/', EventController.listEvents);
router.get('/:id', EventController.getEventById);

export default router;
