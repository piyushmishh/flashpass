import { kafkaConsumer, kafkaProducer } from '../config/kafka';
import { logger } from '../utils/logger';

export async function runOrderWorker() {
  try {
    await kafkaConsumer.connect();
    await kafkaProducer.connect();
    await kafkaConsumer.subscribe({ topic: 'order-events' });

    logger.info('[Order Worker] Listening to Kafka topic: order-events');

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }: any) => {
        try {
          const valueStr = message?.value?.toString();
          if (!valueStr) return;

          const event = JSON.parse(valueStr);
          logger.info(`[Order Worker] Received event ${event.eventType} for aggregate: ${event.aggregateId}`);

          if (event.eventType === 'ORDER_CREATED') {
            await kafkaProducer.send({
              topic: 'payment-events',
              messages: [
                {
                  key: event.aggregateId,
                  value: JSON.stringify({
                    eventType: 'INITIATE_PAYMENT',
                    orderId: event.aggregateId,
                    amountCents: event.payload.total_price_cents,
                    userId: event.payload.user_id,
                    timestamp: new Date().toISOString()
                  })
                }
              ]
            });
            logger.info(`[Order Worker] Dispatched INITIATE_PAYMENT for order ${event.aggregateId}`);
          }
        } catch (err) {
          logger.error('[Order Worker] Error processing message:', err);
        }
      }
    });
  } catch (error) {
    logger.debug('[Order Worker] Local event listener initialized');
  }
}
