import { createHash } from 'crypto';
import { apiKeysRepository } from '@/src/modules/api-keys/api-keys.repository';

export async function authenticateApiKey(req: Request): Promise<string | null> {
  const raw = req.headers.get('x-api-key');
  if (!raw) return null;
  const keyHash = createHash('sha256').update(raw).digest('hex');
  const record = await apiKeysRepository.findByHash(keyHash);
  if (!record) return null;
  void apiKeysRepository.updateLastUsed(record.id);
  return record.userId;
}
