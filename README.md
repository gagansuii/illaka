# ILAKA Events Application

ILAKA is a location-based community events platform built with Next.js 16+, TypeScript, Prisma (PostgreSQL + PostGIS), and NextAuth. Key features: event discovery by geolocation, AI-powered semantic search, Razorpay payments, Cloudinary media uploads, engagement scoring, and digital event tickets.

## Getting Started

1. **Copy example env and populate**
   ```bash
   cp .env.example .env
   # edit values (especially DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, etc.)
   # for local Postgres, use sslmode=disable unless your server explicitly requires TLS
   # leave REDIS_URL blank unless a Redis server is running
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Generate Prisma client and migrate**
   ```bash
   npx prisma migrate dev
   npm run prisma:generate
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server (via scripts/dev-guard.mjs) |
| `npm run dev:turbo` | Dev server with Turbopack |
| `npm run dev:webpack` | Dev server with Webpack |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint (zero warnings enforced) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create and apply migration (dev) |
| `npm run prisma:deploy` | Apply migrations (production) |
| `npm run audit:media` | Audit orphaned Cloudinary media |

## Docker

A `Dockerfile` and `docker-compose.yml` are provided for easy setup.

```bash
# build images and start containers
docker-compose up --build

# the app will be available on http://localhost:3000
```

Services included in `docker-compose`:
- **web**: Next.js application
- **db**: PostgreSQL (15)
- **redis**: Redis for rate limiting/session caching

## Environment Variables

See `.env.example` for all required vars. The application throws an error at startup if any required server-side variable is missing.

Required:
- `DATABASE_URL` — PostgreSQL connection string (pooled, for Prisma)
- `DIRECT_URL` — Direct (non-pooled) PostgreSQL connection string (for migrations)
- `NEXTAUTH_SECRET` — Required in production

Optional (feature-gated):
- `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` — AI semantic search
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Media uploads (falls back to local)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — Payments
- `REDIS_URL` — Rate limiting (falls back to in-memory LRU)
- `IPINFO_TOKEN` — IP geolocation (falls back to ip-api.com)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — Reminder emails
- `CRON_SECRET` — Secures cron endpoints
- `HEALTH_SECRET` — Secures health check endpoint (falls back to `CRON_SECRET`)

## Architectural Notes

- `lib/config.ts` wraps `process.env` and enforces presence and correct type of configuration values.
- Rate limiting uses Redis when `REDIS_URL` is set, otherwise an in-memory LRU cache.
- API routes use `zod` to validate incoming JSON and respond with sensible error messages.
- The deprecated `middleware.ts` convention is replaced with `proxy.ts` as required by Next.js 16+.
- The Prisma schema defines a `geography` column (via `Unsupported`) for fast geospatial queries. The `postgis` extension must be enabled (`CREATE EXTENSION IF NOT EXISTS postgis;`).
- `reactStrictMode` is disabled in `next.config.mjs` to avoid double-mount issues with Leaflet and Three.js.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are set in `next.config.mjs`.

## Testing

Adding automated tests for key flows (event creation, RSVP, payment/webhook, AI search, ticket generation) is recommended. Consider Playwright for E2E or Jest for unit/integration tests.
