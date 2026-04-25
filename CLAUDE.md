# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ILAKA** is a location-based community events platform built with Next.js 16+, TypeScript, Prisma (PostgreSQL + PostGIS), and NextAuth. Key features: event discovery by geolocation, AI-powered semantic search, Razorpay payments, Cloudinary media uploads, and engagement scoring.

## Commands

```bash
# Development
npm run dev              # starts dev server (via scripts/dev-guard.mjs)
npm run dev:webpack      # dev server with Webpack bundler instead of Turbopack

# Build & production
npm run build
npm run start

# Linting (zero warnings enforced)
npm run lint

# Prisma
npm run prisma:generate  # regenerate Prisma client after schema changes
npm run prisma:migrate   # create and apply a new migration (dev)
npm run prisma:deploy    # apply migrations in production

# Utilities
npm run audit:media      # audit orphaned Cloudinary media
```
## Product Philosophy

ILAKA is a **relevance-first event discovery platform** with an optional map view.

Core principles:
- The default experience is a **scrollable feed of the most relevant nearby events**
- Events should be ranked by:
  - proximity
  - engagementScore
  - semantic relevance (AI search)
- Users should discover good events instantly without needing to interact with a map

Map is a **secondary exploration mode**, not the primary interface.

Avoid:
- Forcing map interactions for discovery
- Empty or low-signal feeds
- Feature bloat
## Feed UX Rules

- Default screen = scrollable event feed
- Show highest relevance events at the top
- Each event card should be:
  - visually clean
  - quick to scan (title, distance, time, category)
- Prioritize fast loading and smooth scrolling

Map View:
- Optional toggle (e.g., "Map View")
- Used for spatial exploration, not primary discovery
- Should sync with feed results (same dataset)

Avoid:
- Switching context unexpectedly between feed and map
- Showing different data between feed and map

## Event Ranking Guidelines

Default feed ranking should balance:
- proximity (strong weight)
- engagementScore
- recency (upcoming events prioritized)
- AI semantic relevance (when search is used)

Never:
- show far-away events above nearby relevant ones
- show low-quality events at the top

If data is sparse:
- expand radius gradually instead of lowering quality

## Decision Guidelines

When generating code or features:

- Choose the simplest working solution
- Prefer MVP implementations over scalable abstractions
- Avoid adding new dependencies unless necessary
- If multiple approaches exist, pick the one with:
  - fewer moving parts
  - better performance on mobile
- Do not introduce new features unless explicitly asked
## Architecture

### Directory Structure
The app lives in `app/app/` (the Next.js app root). Notable directories:
- `(admin)/` — admin-only route group
- `(auth)/` — login/register pages
- `(user)/` — authenticated user pages (events, profile)
- `api/` — App Router route handlers: `events/`, `ai-search/`, `auth/`, `geo/`, `payments/`, `upload/`, `users/`
- `components/` — shared React components (`MapScreen`, `SwipeDeck`, `PaymentButton`, etc.)
- `sections/` — landing page sections
- `lib/` — server-side utilities (see below)
- `prisma/` — Prisma schema and migrations
- `three/` — Three.js scene files

## AI & Search Constraints

- AI search must always respect geolocation constraints
- Do not return results outside user radius
- Prioritize relevance + proximity over semantic similarity alone
- Cache aggressively to reduce API costs
### Routing & Middleware
`proxy.ts` handles authentication redirects — Next.js 16+ uses this filename instead of `middleware.ts`. It exports `proxy` (the handler) and `config` (the matcher). It protects `/admin/*`, `/profile`, and `/events/new`, redirecting unauthenticated users to `/login`. Do NOT create a `middleware.ts` alongside it — Next.js 16 will throw a conflict error.

### Authentication
`lib/auth.ts` configures NextAuth with a Credentials provider (email + bcrypt password). JWTs store `id` and `role` (USER | ORGANIZER | ADMIN). `NEXTAUTH_SECRET` is required in production.

### Database
PostgreSQL with PostGIS extension. The `Event` model has a `location geography` column (PostGIS `Unsupported` type) with a GiST index for geospatial queries. **PostGIS must be enabled** before running migrations:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
Prisma client is a singleton in `lib/prisma.ts`.

### AI Search
`api/ai-search/route.ts` uses OpenAI `text-embedding-3-small` (1536-dim) to embed queries, queries a Pinecone index (`ilaka-events`, cosine metric), then post-filters by geospatial radius. Results are ranked by a weighted blend of Pinecone score (70%) and `engagementScore` (30%). Results are cached in-memory via `lib/ai-cache.ts`.

### Engagement Scoring
`lib/engagement.ts` computes `engagementScore` via a single atomic SQL `UPDATE` (not multiple COUNT queries). Weights: RSVP×3, Like×1, Share×5, Attendance×10.

### Rate Limiting
`lib/rate-limit.ts` uses Redis (via `REDIS_URL`) when available; falls back silently to an in-memory LRU cache. Redis failures auto-disable Redis and fall back without crashing.

### Geolocation
`lib/geo.ts` resolves IP to coordinates using ipinfo.io (preferred) then ip-api.com as fallback. Both providers have circuit breakers (3 failures → 60s open).

### Environment Variables
`lib/config.ts` provides `getEnv()` / `getEnvOptional()` / `getEnvNumber()` — use these for all env access on the server; they throw with clear messages on missing required vars.

Required vars (see `.env.example`):
- `DATABASE_URL`, `SHADOW_DATABASE_URL` — PostgreSQL connection strings
- `NEXTAUTH_SECRET` — required in production
- `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` — optional; AI search disabled if absent
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `REDIS_URL` — optional; in-memory fallback used when absent
- `IPINFO_TOKEN` — optional; ip-api.com fallback used when absent

### Caching (in-memory, server-side)
- `lib/events-cache.ts` — geo-bucketed events cache (100m radius buckets, max 500 entries)
- `lib/ai-cache.ts` — AI query result cache

### Payments
Razorpay integration: `api/payments/initiate/` creates orders, `api/payments/webhook/` verifies HMAC signatures and records `Payment` rows.

### API Pattern
All route handlers: validate input with `zod`, call `rateLimit()` early, use `getServerSession(authOptions)` for auth checks, return `NextResponse.json()`.

## Key Constraints
- `reactStrictMode` is disabled in `next.config.mjs`
- Server Actions body size limit: 2MB
- Remote images allowed only from `res.cloudinary.com` and OpenStreetMap tile servers
