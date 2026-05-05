import { usersRepository } from './users.repository';
import { ServiceError } from '@/src/core/errors';
import type { MemberSummary, UpdateLocationInput, UpdateProfileInput, UserProfile } from './users.types';

// Strip HTML tags — names are rendered into the DOM in several places and a
// stored XSS payload would fire for every viewer.
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export const usersService = {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await usersRepository.findById(userId);
    if (!user) throw ServiceError.notFound('User');
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    const data: UpdateProfileInput = {};
    if (input.name !== undefined) data.name = stripHtml(input.name);
    if (input.radiusPreference !== undefined) data.radiusPreference = input.radiusPreference;
    await usersRepository.updateProfile(userId, data);
  },

  async updateLocation(userId: string, input: UpdateLocationInput): Promise<void> {
    await usersRepository.updateLocation(userId, input);
  },

  async listMembers(): Promise<{ members: MemberSummary[]; total: number }> {
    const [members, total] = await Promise.all([
      usersRepository.findRecent(20),
      usersRepository.count(),
    ]);
    return { members, total };
  },
};
