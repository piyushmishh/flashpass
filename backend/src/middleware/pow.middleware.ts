/**
 * Proof-of-Work middleware — anti-bot protection for high-value endpoints.
 *
 * Clients must solve a SHA-256 hash challenge before they can reserve tickets.
 * The challenge is: find a nonce such that SHA-256(challenge + nonce) starts
 * with N leading zeros (where N = env.POW_DIFFICULTY).
 *
 * If the PoW headers are absent, the request passes through for backward
 * compatibility. If present but invalid, we reject with 403.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

export const verifyProofOfWork = (req: Request, res: Response, next: NextFunction) => {
  const nonce = req.headers['x-pow-nonce'] as string | undefined;
  const hash = req.headers['x-pow-hash'] as string | undefined;
  const challenge = req.headers['x-pow-challenge'] as string | undefined;

  // If all three are missing, skip — backward compatibility
  if (!nonce && !hash && !challenge) {
    return next();
  }

  // If some but not all are present, that's a malformed request
  if (!nonce || !hash || !challenge) {
    return res.status(403).json({
      success: false,
      error: { message: 'Proof-of-work verification failed' },
    });
  }

  // Compute SHA-256(challenge + nonce) and verify it matches the provided hash
  const computed = crypto
    .createHash('sha256')
    .update(challenge + nonce)
    .digest('hex');

  if (computed !== hash) {
    return res.status(403).json({
      success: false,
      error: { message: 'Proof-of-work verification failed' },
    });
  }

  // Verify the hash starts with the required number of leading zeros
  const difficulty = env.POW_DIFFICULTY;
  const requiredPrefix = '0'.repeat(difficulty);

  if (!hash.startsWith(requiredPrefix)) {
    return res.status(403).json({
      success: false,
      error: { message: 'Proof-of-work verification failed' },
    });
  }

  next();
};
