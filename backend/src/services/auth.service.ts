/**
 * Authentication service — handles user registration and login.
 *
 * Passwords are hashed with bcrypt (cost factor 12), and sessions are
 * managed via stateless JWTs. No refresh token flow here — keeping it
 * simple since the primary focus of FlashPass is the inventory engine.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

// bcrypt cost factor — 12 is a good balance between security and latency.
// Any higher and login response times start creeping above 300ms.
const SALT_ROUNDS = 12;

export const authService = {
  /**
   * Register a new user. Returns a JWT so the user is immediately
   * authenticated after signing up (no need for a separate login step).
   */
  async register(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ token: string; user: { id: string; email: string; full_name: string } }> {
    // Basic validation — a real app would use something like Zod or Joi
    if (!email || !password || !fullName) {
      throw new ValidationError('Email, password, and full name are required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Check for existing account
    const existing = await userRepository.findByEmail(email.toLowerCase());
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.createUser(
      email.toLowerCase(),
      passwordHash,
      fullName
    );

    const token = generateToken(user.id, user.email);

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
    };
  },

  /**
   * Authenticate with email + password. Returns a JWT on success.
   */
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: { id: string; email: string; full_name: string } }> {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      // Deliberately vague error message — don't reveal whether the email exists
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user.id, user.email);

    logger.info('User logged in', { userId: user.id });

    return {
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
    };
  },
};

function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { id: userId, email },
    env.JWT_SECRET,
    { expiresIn: (env.JWT_EXPIRY || '24h') as any }
  );
}
