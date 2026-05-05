import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async createUser(data: { name: string; email: string; password: string }) {
    return prisma.user.create({ data });
  },

  async createResetToken(userId: string): Promise<string> {
    // Expire any previous unused tokens first
    await prisma.passwordResetToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordResetToken.create({ data: { userId, token, expiresAt } });
    return token;
  },

  async findResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  },

  async consumeResetToken(token: string, newPasswordHash: string, userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { password: newPasswordHash } }),
      prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
    ]);
  },

  // ── Email verification ────────────────────────────────────────────────────

  async createVerificationToken(userId: string): Promise<string> {
    // Expire any outstanding unused tokens first
    await prisma.emailVerificationToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    const token = randomUUID();
    await prisma.emailVerificationToken.create({
      data: { userId, token, expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
    });
    return token;
  },

  async findVerificationToken(token: string) {
    return prisma.emailVerificationToken.findUnique({ where: { token } });
  },

  async markEmailVerified(userId: string, token: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
      prisma.emailVerificationToken.update({ where: { token }, data: { used: true } }),
    ]);
  },

  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    return user?.emailVerified ?? false;
  },
};
