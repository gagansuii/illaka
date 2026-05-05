import { prisma } from '@/lib/prisma';
import type { MemberSummary, UpdateLocationInput, UpdateProfileInput, UserProfile } from './users.types';

export const usersRepository = {
  async findById(id: string): Promise<UserProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        latitude: true, longitude: true,
        radiusPreference: true, subscriptionType: true,
      },
    });
  },

  async updateProfile(id: string, data: UpdateProfileInput): Promise<void> {
    await prisma.user.update({ where: { id }, data });
  },

  async updateLocation(id: string, data: UpdateLocationInput): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        radiusPreference: data.radius ?? undefined,
      },
    });
  },

  async findRecent(limit = 20): Promise<MemberSummary[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },

  async count(): Promise<number> {
    return prisma.user.count();
  },
};
