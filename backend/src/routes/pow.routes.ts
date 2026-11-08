/**
 * Proof-of-Work challenge routes.
 *
 * Provides clients with a fresh challenge and the current difficulty level.
 * The client must solve the challenge (find a nonce such that
 * SHA-256(challenge + nonce) starts with `difficulty` leading zeros)
 * before submitting a reservation request.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

const router = Router();

router.get('/challenge', (_req: Request, res: Response) => {
  const challenge = crypto.randomBytes(16).toString('hex');
  res.json({
    challenge,
    difficulty: env.POW_DIFFICULTY,
  });
});

export default router;
