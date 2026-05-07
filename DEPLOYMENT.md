# Ilaaka Deployment Guide

## Local Setup

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - Copy `.env.example` to `.env` and fill in values.
3. Enable PostGIS:
   - Connect to your Neon/Supabase database and run:
     - `CREATE EXTENSION IF NOT EXISTS postgis;`
4. Prisma:
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`

## Database Setup

### Neon DB (Recommended)
1. Create a Neon project and database.
2. Copy the **pooled** connection string into `DATABASE_URL`.
3. Copy the **direct** (non-pooled) connection string into `DIRECT_URL`.
4. Enable PostGIS in Neon SQL editor:
   - `CREATE EXTENSION IF NOT EXISTS postgis;`

### Supabase
1. Create a project in Supabase.
2. Go to Settings > Database and copy the connection string to `DATABASE_URL`.
3. Use the direct connection string for `DIRECT_URL`.
4. Enable PostGIS via SQL editor.

## Pinecone Setup

1. Create a Pinecone project.
2. Create an index named `ilaka-events`:
   - Dimension: 1536 (OpenAI text-embedding-3-small)
   - Metric: cosine
3. Add `PINECONE_API_KEY` and `PINECONE_INDEX` to env.

## Razorpay Setup

1. Create a Razorpay account and generate API keys.
2. Add a webhook endpoint:
   - `https://<your-vercel-domain>/api/payments/webhook`
3. Set webhook secret and add to `RAZORPAY_WEBHOOK_SECRET`.
4. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

## Cloudinary Setup

1. Create a Cloudinary account.
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. If not configured, media uploads fall back to local `public/uploads/`.

## Vercel Deployment

1. Install Vercel CLI:
   - `npm i -g vercel`
2. Login and deploy:
   - `vercel login`
   - `vercel`
3. In the Vercel dashboard, add all environment variables from `.env.example`.
4. Trigger a production deployment:
   - `vercel --prod`

## Environment Variables Reference

### Required
| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) |
| `NEXTAUTH_SECRET` | JWT signing secret |

### Optional (feature-gated)
| Variable | Feature |
|---|---|
| `OPENAI_API_KEY` | AI semantic search |
| `PINECONE_API_KEY` | Vector search index |
| `PINECONE_INDEX` | Pinecone index name (default: `ilaka-events`) |
| `CLOUDINARY_CLOUD_NAME` | Media uploads |
| `CLOUDINARY_API_KEY` | Media uploads |
| `CLOUDINARY_API_SECRET` | Media uploads |
| `RAZORPAY_KEY_ID` | Payments |
| `RAZORPAY_KEY_SECRET` | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | Payment webhook HMAC verification |
| `REDIS_URL` | Rate limiting (in-memory LRU fallback) |
| `IPINFO_TOKEN` | IP geolocation (ip-api.com fallback) |
| `SMTP_HOST` | Reminder emails |
| `SMTP_USER` | Reminder emails |
| `SMTP_PASS` | Reminder emails |
| `SMTP_FROM` | Reminder emails sender address |
| `CRON_SECRET` | Secures `/api/cron/*` endpoints |
| `HEALTH_SECRET` | Secures `/api/health` (falls back to `CRON_SECRET`) |

### Pricing (public client-side)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUBSCRIPTION_PRICE` | Subscription price in paise |
| `NEXT_PUBLIC_HOSTING_FEE_THRESHOLD` | Hosting fee threshold |
| `NEXT_PUBLIC_HOSTING_FEE_AMOUNT` | Hosting fee amount in paise |
| `NEXT_PUBLIC_PROMOTION_PRICE` | Promotion price in paise |

## Cron Jobs

Configured in `vercel.json`:

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/reminders` | `0 3 * * *` (3 AM daily) | Send event reminder emails |
| `/api/cron/cleanup-events` | `30 19 * * *` (7:30 PM daily) | Clean up expired/stale events |

Both endpoints require `Authorization: Bearer <CRON_SECRET>`.
