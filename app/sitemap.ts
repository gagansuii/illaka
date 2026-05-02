import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? 'https://ilaka.app';

  let events: { id: string; updatedAt: Date }[] = [];
  try {
    events = await prisma.event.findMany({
      where: { visibility: 'PUBLIC' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });
  } catch {
    // DB unavailable — return static routes only
  }

  const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${base}/events/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/discover`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...eventUrls
  ];
}
