# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (uses dev-guard.mjs to clear stale locks)
npm run build        # Production build
npm run lint         # ESLint — zero warnings allowed (max-warnings: 0)
npm run prisma:generate   # Regenerate Prisma client after schema changes
npm run prisma:migrate    # Create and apply new migrations (dev)
npm run prisma:deploy     # Apply pending migrations (production)
npm run audit:media       # Audit orphaned Cloudinary media files
```

Docker full-stack (Postgres + Redis + app):
```bash
docker-compose up --build
```

## Architecture

Single Next.js 16 App Router application with PostgreSQL + PostGIS for geospatial event discovery.

### Request path

Browser → Next.js server (App Router + API routes) → PostgreSQL (Prisma ORM) + optional Redis → external services (OpenAI, Pinecone, Razorpay, Cloudinary)

### Directory layout

| Path | Purpose |
|------|---------|
| `app/(auth)/` | Login and register pages |
| `app/(user)/` | Main user-facing pages: discover, events, profile |
| `app/(admin)/` | Admin dashboard |
| `app/api/` | REST API routes |
| `components/` | React components; `components/ui/` holds Radix UI primitives |
| `components/landing/` | Landing page section components |
| `lib/` | Server-side singletons and utilities (see below) |
| `sections/` | Additional landing page sections |
| `three/` | Three.js 3D canvas components |
| `prisma/` | Schema and migrations |
| `scripts/` | Dev and maintenance scripts |

### Key `lib/` modules

- `lib/prisma.ts` — Prisma client singleton
- `lib/auth.ts` — NextAuth config (JWT, credentials provider, 30-day session)
- `lib/config.ts` — Validates all environment variables at startup
- `lib/ai.ts` — OpenAI + Pinecone client initialization
- `lib/engagement.ts` — Engagement score formula: RSVP×3 + Like×1 + Share×5 + Attendance×10
- `lib/events-cache.ts` — In-memory dual-layer cache (fresh 15s, stale 60s, background refresh)
- `lib/geo.ts` — IP geolocation with circuit breaker pattern; falls back between ipinfo.io and ip-api.com
- `lib/rate-limit.ts` — Rate limiting backed by Redis; falls back to LRU cache when Redis is absent
- `lib/media.ts` — Cloudinary uploads and image sanitization
- `lib/razorpay.ts` — Razorpay payment client

### Database

PostgreSQL 15 with PostGIS. Prisma is used for most queries; raw SQL via `prisma.$queryRaw` / `prisma.$executeRaw` is used for PostGIS geography operations (nearby event radius queries use a GIST index on the `location` geography column).

**Models:** User · Event · RSVP · Like · Share · Attendance · Subscription · Payment

Roles: `USER | ORGANIZER | ADMIN`

Requires two databases: `ilaka_events` (main) + `ilaka_shadow` (Prisma shadow DB for safe migrations).

### Geospatial queries

Events have both `latitude`/`longitude` float columns and a PostGIS `geography` column with a GIST index. Radius searches query by `ST_DWithin`. After any schema change to the Event model involving the geography column, ensure the GIST index is recreated in the migration SQL.

### Optional services and graceful degradation

| Service | Fallback when absent |
|---------|---------------------|
| Redis | LRU in-memory cache |
| OpenAI | AI search disabled |
| Pinecone | Vector search disabled |
| Razorpay | Payments disabled |
| Cloudinary | Image upload disabled |
| IPInfo | Tries ip-api.com; then skips geolocation |

`lib/config.ts` validates required env vars at startup and surfaces which optional services are active.

## Key configuration

- **Path alias:** `@/*` maps to the project root
- **Tailwind custom tokens:** `ink` (dark bg), `pearl` (light bg), `neon` (cyan accent), `ember` (orange accent), `glass` (frosted rgba)
- **`reactStrictMode: false`** in `next.config.mjs` (intentional — avoids double-render issues with Three.js and map components)
- **Server Action body limit:** 2 MB (for image uploads)
- **Zod** is used for all API input validation

## Environment setup

Copy `.env.example` to `.env.local`. Only `DATABASE_URL`, `SHADOW_DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` are required to run locally. All other variables enable optional features.
