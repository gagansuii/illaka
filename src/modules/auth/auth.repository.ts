import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

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
};
