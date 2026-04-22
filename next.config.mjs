import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
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
      // Scripts: self + Razorpay checkout
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com",
      // Styles: self + inline (Leaflet, Tailwind)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + Cloudinary + Leaflet tiles + CartoDB + unpkg
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com",
      // Fonts: self
      "font-src 'self'",
      // Frames: Razorpay payment iframe
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      // Connections: self + external APIs
      "connect-src 'self' https://api.razorpay.com https://ipinfo.io https://ip-api.com https://api.openai.com https://*.pinecone.io",
      // Workers: self (Next.js)
      "worker-src 'self' blob:"
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
