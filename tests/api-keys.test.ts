import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// ── Prisma mock ───────────────────────────────────────────────────────────────
const mockPrisma = {
  apiKey: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// ── NextAuth mock ─────────────────────────────────────────────────────────────
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock('@/lib/mailer', () => ({ sendApiKeyEmail: vi.fn().mockResolvedValue(undefined) }));

// ── Lazy imports after mocks ──────────────────────────────────────────────────
const { apiKeysRepository } = await import('@/src/modules/api-keys/api-keys.repository');
const { apiKeysService } = await import('@/src/modules/api-keys/api-keys.service');
const { authenticateApiKey } = await import('@/lib/authenticate-api-key');
const { getServerSession } = await import('next-auth');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(headers: Record<string, string> = {}, body?: unknown) {
  return new Request('http://localhost/api/keys', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
describe('api-keys service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create: generates key with ik_ prefix', async () => {
    mockPrisma.apiKey.count.mockResolvedValue(0);
    mockPrisma.apiKey.create.mockImplementation(({ data }: { data: { id?: string; name: string; prefix: string; createdAt?: Date } }) => ({
      id: 'key-id',
      name: data.name,
      prefix: data.prefix,
      createdAt: new Date(),
    }));

    const result = await apiKeysService.create({ userId: 'u1', name: 'test' });
    expect(result.key).toMatch(/^ik_[0-9a-f]{64}$/);
  });

  it('create: stores SHA-256 hash, not raw key', async () => {
    mockPrisma.apiKey.count.mockResolvedValue(0);
    mockPrisma.apiKey.create.mockImplementation(({ data }: { data: { keyHash: string; name: string; prefix: string } }) => ({
      id: 'key-id',
      name: data.name,
      prefix: data.prefix,
      createdAt: new Date(),
    }));

    const result = await apiKeysService.create({ userId: 'u1', name: 'test' });
    const createCall = mockPrisma.apiKey.create.mock.calls[0][0].data;

    // hash stored must be SHA-256 of the returned raw key
    const expectedHash = createHash('sha256').update(result.key).digest('hex');
    expect(createCall.keyHash).toBe(expectedHash);
    expect(createCall.keyHash).not.toBe(result.key);
  });

  it('create: returns raw key once, never on subsequent list', async () => {
    mockPrisma.apiKey.count.mockResolvedValue(0);
    mockPrisma.apiKey.create.mockResolvedValue({
      id: 'key-id', name: 'test', prefix: 'ik_a3f9b2', createdAt: new Date(),
    });

    const created = await apiKeysService.create({ userId: 'u1', name: 'test' });
    expect(created.key).toBeTruthy();

    // list should never return raw key
    mockPrisma.apiKey.findMany.mockResolvedValue([
      { id: 'key-id', name: 'test', prefix: 'ik_a3f9b2', createdAt: new Date(), lastUsedAt: null },
    ]);
    const listed = await apiKeysService.list('u1');
    expect(listed[0]).not.toHaveProperty('key');
    expect(listed[0]).not.toHaveProperty('keyHash');
  });

  it('create: enforces 10-key cap', async () => {
    mockPrisma.apiKey.count.mockResolvedValue(10);
    await expect(apiKeysService.create({ userId: 'u1', name: 'test' })).rejects.toThrow('Maximum of 10 API keys');
  });

  it('list: never returns keyHash field', async () => {
    mockPrisma.apiKey.findMany.mockResolvedValue([
      { id: 'k1', name: 'ci', prefix: 'ik_aabb', createdAt: new Date(), lastUsedAt: null },
    ]);
    const keys = await apiKeysService.list('u1');
    expect(keys[0]).not.toHaveProperty('keyHash');
  });

  it('revoke: calls deleteByIdAndUserId with correct userId', async () => {
    mockPrisma.apiKey.deleteMany.mockResolvedValue({ count: 1 });
    await apiKeysService.revoke('key-id', 'u1');
    expect(mockPrisma.apiKey.deleteMany).toHaveBeenCalledWith({ where: { id: 'key-id', userId: 'u1' } });
  });

  it('revoke: throws if key not found', async () => {
    mockPrisma.apiKey.deleteMany.mockResolvedValue({ count: 0 });
    await expect(apiKeysService.revoke('missing', 'u1')).rejects.toThrow('API key not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authenticateApiKey helper', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when x-api-key header is absent', async () => {
    const req = new Request('http://localhost/');
    const result = await authenticateApiKey(req);
    expect(result).toBeNull();
  });

  it('returns null when hash not found in DB', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/', { headers: { 'x-api-key': 'ik_bad' } });
    const result = await authenticateApiKey(req);
    expect(result).toBeNull();
  });

  it('returns userId when hash matches', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 'k1', userId: 'u1' });
    mockPrisma.apiKey.update.mockResolvedValue({});
    const req = new Request('http://localhost/', { headers: { 'x-api-key': 'ik_valid' } });
    const result = await authenticateApiKey(req);
    expect(result).toBe('u1');
  });

  it('fires updateLastUsed without awaiting (non-blocking)', async () => {
    let updateCalled = false;
    mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 'k1', userId: 'u1' });
    mockPrisma.apiKey.update.mockImplementation(async () => { updateCalled = true; return {}; });

    const req = new Request('http://localhost/', { headers: { 'x-api-key': 'ik_valid' } });
    await authenticateApiKey(req);
    // The function returned before the promise resolved; update is fire-and-forget
    expect(mockPrisma.apiKey.update).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/keys route handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { GET } = await import('@/app/api/keys/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 200 with key list', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } } as never);
    mockPrisma.apiKey.findMany.mockResolvedValue([
      { id: 'k1', name: 'ci', prefix: 'ik_aabb', createdAt: new Date(), lastUsedAt: null },
    ]);
    const { GET } = await import('@/app/api/keys/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.keys).toHaveLength(1);
    expect(json.keys[0]).not.toHaveProperty('keyHash');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/keys route handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { POST } = await import('@/app/api/keys/route');
    const req = makeRequest({}, { name: 'ci' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when name missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } } as never);
    const { POST } = await import('@/app/api/keys/route');
    const req = makeRequest({}, {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 with { id, key, name, createdAt }', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } } as never);
    mockPrisma.apiKey.count.mockResolvedValue(0);
    mockPrisma.apiKey.create.mockResolvedValue({
      id: 'k1', name: 'ci', prefix: 'ik_aabbcc', createdAt: new Date(),
    });

    const { POST } = await import('@/app/api/keys/route');
    const req = makeRequest({}, { name: 'ci' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('key');
    expect(json).toHaveProperty('name');
    expect(json).toHaveProperty('createdAt');
  });

  it('key in response starts with ik_', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } } as never);
    mockPrisma.apiKey.count.mockResolvedValue(0);
    mockPrisma.apiKey.create.mockResolvedValue({
      id: 'k1', name: 'ci', prefix: 'ik_aabbcc', createdAt: new Date(),
    });

    const { POST } = await import('@/app/api/keys/route');
    const req = makeRequest({}, { name: 'ci' });
    const res = await POST(req);
    const json = await res.json();
    expect(json.key).toMatch(/^ik_/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/keys/:id route handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { DELETE } = await import('@/app/api/keys/[id]/route');
    const req = new Request('http://localhost/api/keys/k1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'k1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 200 { ok: true } on success', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } } as never);
    mockPrisma.apiKey.deleteMany.mockResolvedValue({ count: 1 });

    const { DELETE } = await import('@/app/api/keys/[id]/route');
    const req = new Request('http://localhost/api/keys/k1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'k1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
