import { prisma } from '@/lib/prisma';
import type { ApiKeyRecord } from './api-keys.types';

export const apiKeysRepository = {
  async create(data: { userId: string; name: string; keyHash: string; prefix: string }) {
    return prisma.apiKey.create({ data });
  },

  async findByUserId(userId: string): Promise<ApiKeyRecord[]> {
    return prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByHash(keyHash: string) {
    return prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, userId: true },
    });
  },

  async updateLastUsed(id: string) {
    return prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  },

  async deleteByIdAndUserId(id: string, userId: string) {
    return prisma.apiKey.deleteMany({ where: { id, userId } });
  },

  async countByUserId(userId: string): Promise<number> {
    return prisma.apiKey.count({ where: { userId } });
  },
};
