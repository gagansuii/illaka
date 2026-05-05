import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { ServiceError } from '@/src/core/errors';
import { logger } from '@/src/core/logger';
import { authRepository } from './auth.repository';

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    ip: string,
  ): Promise<{ id: string }> {
    if (!await rateLimit(`register:${ip}`, 5)) throw ServiceError.rateLimited();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await authRepository.findUserByEmail(normalizedEmail);
    if (existing) throw ServiceError.conflict('Email already registered');

    const hashed = await bcrypt.hash(password, 10);
    const user = await authRepository.createUser({ name, email: normalizedEmail, password: hashed });
    return { id: user.id };
  },

  async forgotPassword(email: string, ip: string): Promise<void> {
    // Silently throttle — returning ok regardless prevents user enumeration
    if (!await rateLimit(`forgot-password:${ip}`, 5)) return;

    const user = await authRepository.findUserByEmail(email);
    if (!user) return; // user enumeration protection

    const token = await authRepository.createResetToken(user.id);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (err) {
      logger.error('Failed to send reset email', { email, error: String(err) });
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await authRepository.findResetToken(token);
    if (!record || record.used || record.expiresAt < new Date()) {
      throw ServiceError.badRequest('This reset link is invalid or has expired.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await authRepository.consumeResetToken(token, hashed, record.userId);
  },
};
