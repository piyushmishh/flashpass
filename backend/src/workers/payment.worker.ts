import { kafkaConsumer } from '../config/kafka';
import { paymentService } from '../services/payment.service';
import { orderRepository } from '../repositories/order.repository';
import { inventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';

export async function runPaymentWorker() {
  try {
    await kafkaConsumer.subscribe({ topic: 'payment-events' });
    logger.info('[Payment Worker] Subscribed to payment-events');
  } catch (error) {
    logger.debug('[Payment Worker] Running in standalone mode');
  }
}
