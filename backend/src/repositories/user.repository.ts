/**
 * User repository — thin data-access layer over PostgreSQL.
 *
 * No business logic here, just CRUD. The service layer decides what to
 * do with the data; this layer just knows how to get it in and out of
 * the database.
 */

import { query } from '../config/database';
import { User } from '../types';

export const userRepository = {
  /**
   * Create a new user account. The password should already be hashed by
   * the auth service before it gets here.
   */
  async createUser(
    email: string,
    passwordHash: string,
    fullName: string
  ): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, passwordHash, fullName]
    );
    return result.rows[0];
  },

  /** Look up a user by email — used during login. */
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /** Look up by primary key — used to verify JWT claims. */
  async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },
};
