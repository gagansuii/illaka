import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/mailer';
import { analytics } from '@/lib/posthog';
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
    analytics.userSignedUp(user.id);
    return { id: user.id };
  },

  async forgotPassword(email: string, ip: string): Promise<void> {
    // Silently throttle — returning ok regardless prevents user enumeration
    if (!await rateLimit(`forgot-password:${ip}`, 5)) return;

    const user = await authRepository.findUserByEmail(email);
    if (!user) return; // user enumeration protection

    const token = await authRepository.createResetToken(user.id);
    const rawBase = process.env.NEXTAUTH_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const baseUrl = rawBase.replace(/\/$/, '');
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

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    if (!await rateLimit(`verify-email:${userId}`, 3)) {
      throw ServiceError.rateLimited();
    }
    const token = await authRepository.createVerificationToken(userId);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    try {
      await sendVerificationEmail(email, verifyUrl);
    } catch (err) {
      logger.error('Failed to send verification email', { userId, error: String(err) });
    }
  },

  async verifyEmail(token: string): Promise<void> {
    const record = await authRepository.findVerificationToken(token);
    if (!record || record.used || record.expiresAt < new Date()) {
      throw ServiceError.badRequest('This verification link is invalid or has expired.');
    }
    await authRepository.markEmailVerified(record.userId, token);
  },

  async requireEmailVerified(userId: string): Promise<void> {
    if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'true') return;
    const verified = await authRepository.isEmailVerified(userId);
    if (!verified) {
      throw ServiceError.badRequest('Please verify your email address before performing this action.');
    }
  },
};
