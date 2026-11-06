import { runExpiryWorker } from './expiry.worker';
import { runOrderWorker } from './order.worker';
import { runPaymentWorker } from './payment.worker';
import { logger } from '../utils/logger';

async function startWorkers() {
  logger.info('[Workers] Initializing FlashPass background worker cluster...');
  await runExpiryWorker();
  await runOrderWorker();
  await runPaymentWorker();
  logger.info('[Workers] All background workers initialized.');
}

if (require.main === module) {
  startWorkers().catch((err) => {
    logger.error('[Workers] Fatal worker error:', err);
    process.exit(1);
  });
}

export { startWorkers };
