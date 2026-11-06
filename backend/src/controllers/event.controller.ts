import { Request, Response, NextFunction } from 'express';
import { eventRepository } from '../repositories/event.repository';
import { inventoryService } from '../services/inventory.service';
import { NotFoundError } from '../utils/errors';

export class EventController {
  static async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventRepository.findActive();
      // Hydrate with ultra-fast real-time stock from Redis
      const hydrated = await Promise.all(
        events.map(async (ev: any) => {
          const liveStock = await inventoryService.getCurrentStock(ev.id);
          return {
            ...ev,
            current_stock: liveStock !== null ? liveStock : ev.current_stock
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: hydrated
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const event = await eventRepository.findById(id);
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const liveStock = await inventoryService.getCurrentStock(event.id);
      const data = {
        ...event,
        current_stock: liveStock !== null ? liveStock : event.current_stock
      };

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}
