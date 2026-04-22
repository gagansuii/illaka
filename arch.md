# Illaka 2.0 — Architecture

## Overview

Illaka is a hyperlocal event discovery platform. Users find events happening near them on a live map, RSVP, and pay organisers. Organisers create events (physical or online), manage attendance, and get paid. A single Next.js 16 App Router application serves the entire product — frontend, backend API, and background jobs all live in one repo.

---

## Request Path

```
Browser
  │
  ▼
Next.js 16 App Router  (Vercel / Node.js)
  │
  ├── Server Components  →  Prisma ORM  →  PostgreSQL 15 + PostGIS
  ├── API Routes         →  Prisma ORM  →  PostgreSQL 15 + PostGIS
  │                      →  Redis (optional, rate-limiting & cache)
  │
  ├── External: OpenAI          (AI semantic search — optional)
  ├── External: Pinecone        (vector index — optional)
  ├── External: Razorpay        (payments — optional)
  ├── External: Cloudinary      (media uploads — optional, falls back to local)
  ├── External: IPInfo / ip-api (geolocation fallback — optional)
  └── External: SMTP            (reminder emails — optional)
```

---

## Directory Layout

```
app/
  (auth)/             Login, register, forgot/reset password
  (user)/             Main user-facing pages
    page.tsx          Landing / home
    discover/         Map + event discovery (MapScreen)
    events/[id]/      Event detail page
    events/new/       Event creation form
    profile/          User profile
  (admin)/admin/      Admin dashboard
  api/                All REST API routes (see API section)

components/
  ui/                 Radix UI primitives (Button, Card, Input, Slider…)
  MapScreen.tsx       Discover page — map, search, event cards
  MapView.tsx         Leaflet map renderer (SSR-disabled)
  EventDetailClient.tsx  Full event detail view
  EventPreviewDrawer.tsx Quick-view drawer
  PaymentButton.tsx   Razorpay checkout trigger
  SwipeDeck.tsx       Mobile swipe card deck
  ResilientImage.tsx  Image with fallback

lib/
  prisma.ts           Prisma client singleton
  auth.ts             NextAuth config (JWT, credentials, 30-day session)
  config.ts           Env var validation + getEnvOptional helper
  useGeolocation.ts   Client hook: browser GPS → IP fallback → unavailable
  geo.ts              Server-side IP geolocation (ipinfo.io → ip-api.com, circuit breaker)
  engagement.ts       Engagement score formula (atomic SQL UPDATE)
  events-cache.ts     Dual-layer in-memory cache (fresh 15 s, stale 60 s, background refresh)
  rate-limit.ts       Rate limiting (Redis → LRU fallback)
  media.ts            Local upload sanitization + Cloudinary utilities
  mailer.ts           nodemailer wrapper (SMTP, gracefully skips if unconfigured)
  ai.ts               OpenAI + Pinecone client initialization
  razorpay.ts         Razorpay client singleton
  event-style.ts      Theme engine, formatters (IST/en-IN), category options

prisma/
  schema.prisma       Single source of truth for all models
  migrations/         Applied migration SQL files

scripts/              Dev and maintenance utilities
three/                Three.js 3D canvas components (landing page)
sections/             Landing page section components
```

---

## Frontend

### Rendering strategy

| Route | Strategy | Why |
|---|---|---|
| Landing (`/`) | Server Component + client 3D sections | SEO + heavy animation |
| Discover (`/discover`) | Server Component shell + `'use client'` MapScreen | Map requires browser APIs |
| Event detail (`/events/[id]`) | Server Component fetches data, passes to client component | SEO for event pages |
| Event creation (`/events/new`) | Full client component | Complex form state |
| Auth pages | Client components | Form interactions |
| Admin | Client component | Dashboard mutations |

`reactStrictMode: false` in `next.config.mjs` — intentional, avoids double-mount issues with Leaflet and Three.js.

### Map

Leaflet + React Leaflet, loaded via `dynamic(..., { ssr: false })`. The `useGeolocation` hook resolves the user's position before the map mounts:

```
Component mounts
  → status: 'pending', center: null  →  spinner shown, Leaflet NOT mounted
  → navigator.geolocation (8 s timeout, 60 s cache)
      ├── success  →  status: 'resolved',    center: [lat, lng]
      └── error    →  fetch /api/geo/ip
                        ├── ok      →  status: 'ip-fallback', center: [lat, lng]
                        └── fails   →  status: 'unavailable', center: null
  → center non-null  →  MapContainer mounts at real coordinates
  → centerParams non-empty  →  /api/events?lat=…&lng=…&radius=… fires
```

Map tile provider: CartoDB Light (`basemaps.cartocdn.com`).

### Engagement score

Computed in a single atomic SQL UPDATE whenever a social action occurs:

```
score = RSVP × 3  +  Like × 1  +  Share × 5  +  Attendance × 10
```

Events are ordered by `engagementScore DESC` on the discover map.

### Design tokens (Tailwind)

| Token | Value | Use |
|---|---|---|
| `ink` | dark background | Page backgrounds |
| `pearl` | light background | Card surfaces |
| `neon` | cyan accent | Primary actions |
| `ember` | orange accent | Secondary actions |
| `glass` | frosted rgba | Overlay surfaces |

CSS variables: `--secondary`, `--accent`, `--muted`, `--surface`, `--surface-strong`, `--line`, `--bg-deep`.

---

## API Routes

```
POST  /api/auth/register            Create account (bcrypt password)
POST  /api/auth/forgot-password     Send reset token email
POST  /api/auth/reset-password      Consume token, update password
GET   /api/auth/[...nextauth]       NextAuth.js handler (sign in/out, session)

GET   /api/events                   Nearby events (PostGIS radius query, cached)
POST  /api/events                   Create event (auth required, Pinecone indexed)
GET   /api/events/[id]              Single event detail
PATCH /api/events/[id]              Edit event (organiser only)
POST  /api/events/[id]/rsvp         Toggle RSVP
POST  /api/events/[id]/share        Record share, recalc engagement
GET   /api/events/[id]/invite       Generate/return private share token

POST  /api/ai-search                Semantic search via OpenAI + Pinecone

GET   /api/geo/ip                   IP-based geolocation (ipinfo → ip-api fallback)

POST  /api/payments/initiate        Create Razorpay order
POST  /api/payments/webhook         Razorpay HMAC-verified webhook → update Payment row

POST  /api/upload                   Upload image to local public/uploads/ (auth required)
                                    Allowed folders: ilaka/banners, ilaka/badges, ilaka/payment-qr

POST  /api/users/location           Persist user lat/lng/radius (throttled, auth required)
GET   /api/users/profile            Fetch own profile
PATCH /api/users/profile            Update name / avatar

GET   /api/cron/reminders           Hourly cron: send reminder emails for upcoming events
                                    Secured with Authorization: Bearer <CRON_SECRET>

PATCH /api/admin/events/[id]        Admin: edit any event
DELETE /api/admin/events/[id]       Admin: delete event
PATCH /api/admin/users/[id]         Admin: change role / ban
```

---

## Database

### Engine

PostgreSQL 15 with the PostGIS extension. Two databases are required:

| Database | Purpose |
|---|---|
| `ilaka_events` | Main application data |
| `ilaka_shadow` | Prisma shadow DB (safe migration diffing) |

### Models

#### `User`
Stores credentials and location preference. Roles: `USER | ORGANIZER | ADMIN`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String | Unique |
| `password` | String | bcrypt hash |
| `role` | Enum | USER / ORGANIZER / ADMIN |
| `latitude` | Float? | Last known position |
| `longitude` | Float? | Last known position |
| `radiusPreference` | Int | Default 5000 m |
| `subscriptionType` | String? | Optional plan label |

#### `Event`
Core entity. Holds both scalar coordinates (for simple queries) and a PostGIS `geography` column (for fast radius searches).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `latitude / longitude` | Float | Scalar copy |
| `location` | geography | PostGIS column, GIST-indexed |
| `eventType` | Enum? | PHYSICAL / ONLINE |
| `onlineLink` | String? | Meeting URL (Zoom, Meet, Discord…) |
| `linkShareMode` | Enum? | IMMEDIATE / BEFORE_EVENT |
| `isPaid` | Boolean | Toggles payment QR display |
| `paymentQrUrl` | String? | Organiser-uploaded payment QR image |
| `engagementScore` | Int | Computed: RSVP×3 + Like×1 + Share×5 + Attendance×10 |
| `shareToken` | String? | Unique token for private invite links |
| `visibility` | Enum | PUBLIC / PRIVATE |

Indexes: `GIST(location)`, `organizerId`, `visibility`.

#### `RSVP` / `Like` / `Share` / `Attendance`
Join tables between `User` and `Event`. Each has a composite unique constraint on `(userId, eventId)` except `Share` (a user can share multiple times). Writing to any of these triggers a re-computation of `engagementScore`.

#### `Subscription`
Tracks a user's active plan (status, plan name, start/end dates). Not yet wired to feature gates.

#### `Payment`
Razorpay payment record. `reason` field values: `hosting_fee | promotion | subscription`. Webhook sets `status` to `paid` / `failed`.

#### `PasswordResetToken`
Short-lived token for the forgot-password flow. Has `expiresAt` and `used` flag to prevent replay.

#### `ReminderLog`
Deduplication log for reminder emails. Unique on `(eventId, userId, type)` — prevents sending the same reminder twice if the cron fires late or is retried.

| `type` | When sent | Event types |
|---|---|---|
| `6h` | 6 hours before start | PHYSICAL only |
| `1h` | 1 hour before start | PHYSICAL + ONLINE |
| `1d` | 24 hours before start | ONLINE only |

### Geospatial queries

Radius search uses PostGIS `ST_DWithin` against the `geography` column:

```sql
SELECT ... FROM "Event"
WHERE "visibility" = 'PUBLIC'
  AND ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    :radius   -- metres
  )
ORDER BY "engagementScore" DESC
LIMIT 200
```

The GIST index on `location` makes this sub-millisecond for typical city-scale queries. The ORM (Prisma) cannot express PostGIS operations natively, so these queries use `prisma.$queryRaw`.

### ER Diagram (simplified)

```
User ──< RSVP >── Event
User ──< Like >── Event
User ──< Share >── Event
User ──< Attendance >── Event
User ──< Payment >── Event?
User ──< Subscription
User ──< PasswordResetToken
User ──< ReminderLog >── Event
User ──< Event (organizer)
```

---

## Caching

### In-memory events cache (`lib/events-cache.ts`)

A dual-layer stale-while-revalidate cache for the `/api/events` endpoint. Keyed on `(lat, lng, radius)` rounded to 3 decimal places.

| Window | Behaviour |
|---|---|
| 0 – 15 s (fresh) | Return cached data immediately |
| 15 – 75 s (stale) | Return cached data + trigger background refresh |
| > 75 s (expired) | Block and await fresh DB fetch |

### Rate limiting (`lib/rate-limit.ts`)

Sliding-window rate limiter. Uses Redis when available; falls back to an in-process LRU cache when Redis is absent. Applied to the events query endpoint to prevent scraping.

---

## Optional Services & Graceful Degradation

| Service | Env vars required | Fallback |
|---|---|---|
| Redis | `REDIS_URL` | In-process LRU cache |
| OpenAI | `OPENAI_API_KEY` | AI search endpoint returns empty results |
| Pinecone | `PINECONE_API_KEY`, `PINECONE_INDEX` | Vector search disabled; text search only |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payment buttons hidden |
| Cloudinary | `CLOUDINARY_*` | Local file upload to `public/uploads/` |
| IPInfo | `IPINFO_TOKEN` | Falls back to ip-api.com; then geolocation skipped |
| SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Reminder emails skipped with console warning |
| Cron secret | `CRON_SECRET` | Cron endpoint open (not recommended in production) |

All validation and capability detection lives in `lib/config.ts`.

---

## Authentication

NextAuth.js with a **credentials provider** (email + bcrypt password). Sessions are JWT-encoded with a **30-day expiry**. The `session.user.id` and `session.user.role` fields are added to the token via a custom `callbacks.jwt` handler.

Password reset flow: POST `/api/auth/forgot-password` → store `PasswordResetToken` → email link → POST `/api/auth/reset-password` with token → mark token used → update password hash.

---

## Background Jobs

### Vercel Cron

`vercel.json` configures one cron job:

```json
{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }
```

Fires every hour. The handler:
1. Finds events starting in each reminder window (with ±5 min buffer)
2. Loads all RSVPs for those events
3. Checks `ReminderLog` to skip already-sent reminders
4. Sends emails via `lib/mailer.ts` (nodemailer)
5. Writes a `ReminderLog` row on success

---

## Key Design Decisions

**Why raw SQL for events?** PostGIS geography operations (`ST_DWithin`, `ST_MakePoint`) are not expressible through Prisma's query builder. Raw SQL is used only where PostGIS is required; all other queries use the ORM.

**Why dual coordinates on Event?** `latitude`/`longitude` float columns are used for simple serialisation and client-side map rendering. The `geography` column is used exclusively for the spatial index and radius queries. They are always written together.

**Why in-memory event cache instead of Redis?** Redis is optional. The in-memory cache guarantees fast responses even without Redis. The cache is process-local, so multiple Node.js instances will each hold their own cache — acceptable at the current scale.

**Why `reactStrictMode: false`?** Leaflet and Three.js both attach imperative handles to the DOM. React 18 strict mode double-invokes effects in development, which causes map tiles and 3D canvases to flicker or crash. Disabled intentionally.

**Why `geography` instead of `geometry`?** `geography` uses WGS-84 (degrees) and computes distances in metres on a spherical earth without requiring a projection. `ST_DWithin` on a geography column with a GIST index is the simplest correct choice for "events within X metres of the user."
