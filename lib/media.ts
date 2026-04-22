import { existsSync } from 'node:fs';
import path from 'node:path';

const LOCAL_UPLOAD_PREFIX = '/uploads/';
const CHECK_CACHE_TTL_MS = 30_000;

const localMediaExistsCache = new Map<string, { exists: boolean; checkedAt: number }>();

function normalizeLocalUrl(url: string) {
  return url.split('?')[0].split('#')[0];
}

function isExistingLocalMedia(url: string) {
  const normalizedUrl = normalizeLocalUrl(url);
  const cached = localMediaExistsCache.get(normalizedUrl);
  const now = Date.now();
  if (cached && now - cached.checkedAt < CHECK_CACHE_TTL_MS) {
    return cached.exists;
  }

  const relativePath = normalizedUrl.replace(/^\/+/, '');
  const absolutePath = path.join(process.cwd(), 'public', relativePath);
  const exists = existsSync(absolutePath);
  localMediaExistsCache.set(normalizedUrl, { exists, checkedAt: now });
  return exists;
}

export function sanitizeMediaUrl(url: string) {
  if (!url || !url.startsWith(LOCAL_UPLOAD_PREFIX)) {
    return url;
  }
  return isExistingLocalMedia(url) ? url : '';
}

export function sanitizeEventMedia<T extends { bannerUrl: string; badgeIcon: string; paymentQrUrl?: string | null }>(event: T): T {
  return {
    ...event,
    bannerUrl: sanitizeMediaUrl(event.bannerUrl),
    badgeIcon: sanitizeMediaUrl(event.badgeIcon),
    ...(event.paymentQrUrl != null ? { paymentQrUrl: sanitizeMediaUrl(event.paymentQrUrl) } : {})
  };
}

export function sanitizeEventMediaList<T extends { bannerUrl: string; badgeIcon: string; paymentQrUrl?: string | null }>(events: T[]): T[] {
  return events.map((event) => sanitizeEventMedia(event));
}
