import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self)'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is removed in production; required only for Next.js HMR in dev.
      // 'unsafe-inline' remains for Leaflet/Tailwind until nonces are implemented.
      isDev
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com"
        : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      // Styles: self + inline (Leaflet, Tailwind runtime styles)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + Cloudinary + map tiles. data:/blob: scoped to avoid XSS via SVG.
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
      // Fonts: self only
      "font-src 'self'",
      // Frames: Razorpay payment iframe only
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      // Connections: self + required external services + PostHog analytics
      "connect-src 'self' https://api.razorpay.com https://ipinfo.io https://ip-api.com https://api.openai.com https://*.pinecone.io https://app.posthog.com https://eu.posthog.com https://*.posthog.com",
      // Workers: blob: required for Leaflet tile workers
      "worker-src 'self' blob:",
      // Prevent embedding in iframes from other origins
      "frame-ancestors 'none'"
    ].join('; ')
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  turbopack: {
    root: projectRoot
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.tile.openstreetmap.org' }
    ]
  }
};

export default nextConfig;
