import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://ilaka.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/discover', '/events/'],
        disallow: ['/api/', '/admin/', '/profile', '/events/new']
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
