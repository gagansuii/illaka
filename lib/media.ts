export function sanitizeMediaUrl(url: string): string {
  if (!url) return '';
  // Accept Cloudinary URLs and any absolute https URLs; reject local /uploads/ paths
  // that only existed on the dev filesystem and are unreachable in production.
  if (url.startsWith('/uploads/')) return '';
  return url;
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
