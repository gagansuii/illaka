export type CreateApiKeyInput = { userId: string; name: string };

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export type ApiKeyLookupResult = { id: string; userId: string } | null;
