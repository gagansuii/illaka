import { createHash, randomBytes } from 'crypto';
import { apiKeysRepository } from './api-keys.repository';
import { ServiceError } from '@/src/core/errors';
import type { CreateApiKeyInput } from './api-keys.types';

function hashKey(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export const apiKeysService = {
  async create(input: CreateApiKeyInput) {
    const count = await apiKeysRepository.countByUserId(input.userId);
    if (count >= 10) throw ServiceError.badRequest('Maximum of 10 API keys per account');

    const raw = `ik_${randomBytes(32).toString('hex')}`;
    const keyHash = hashKey(raw);
    const prefix = raw.slice(0, 8);

    const record = await apiKeysRepository.create({ ...input, keyHash, prefix });
    return { id: record.id, key: raw, name: record.name, createdAt: record.createdAt };
  },

  async list(userId: string) {
    return apiKeysRepository.findByUserId(userId);
  },

  async revoke(id: string, userId: string) {
    const result = await apiKeysRepository.deleteByIdAndUserId(id, userId);
    if (result.count === 0) throw ServiceError.notFound('API key');
  },
};
