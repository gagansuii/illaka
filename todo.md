# Ilaka — Production Readiness TODO

Items are roughly ordered by impact. Strike through when done.

---

## Critical — Security

- [x] **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS added to `next.config.mjs`
- [ ] **Rate limit auth endpoints** — apply `rateLimit()` to `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, and `/api/auth/[...nextauth]` login attempts
- [ ] **File upload hardening** — validate actual MIME type (not just extension), enforce 5 MB size limit, restrict to image/* only
- [ ] **Password strength** — require at least one uppercase, one number, one special character (update Zod schema + UI feedback)
- [ ] **Email verification on register** — send verification email, block login until verified; add `emailVerified` field to User model
- [ ] **Input sanitisation** — trim and strip HTML from event title/description at API boundary before DB write
- [ ] **CORS policy** — restrict API routes to same-origin or explicitly allowed origins in `next.config.mjs`

---

## Critical — Reliability

- [x] **Error pages** — `app/error.tsx` (route-level), `app/global-error.tsx` (root fallback), `app/not-found.tsx` (404) all implemented
- [ ] **Loading skeletons** — add `app/(user)/discover/loading.tsx`, `app/(user)/events/[id]/loading.tsx` (event detail has one; discover missing)
- [x] **Health check endpoint** — `/api/health` returns DB connectivity status; secured with `HEALTH_SECRET` or `CRON_SECRET`
- [ ] **Prisma connection pooling** — configure `connection_limit` and `pool_timeout` in `DATABASE_URL` or PrismaClient options for production concurrency

---

## High — SEO & Discoverability

- [ ] **Dynamic event metadata** — add `generateMetadata` to `app/(user)/events/[id]/page.tsx` with event title, description, image (OpenGraph + Twitter card)
- [ ] **Root layout OpenGraph** — add `og:image`, `og:type`, `twitter:card` to root `app/layout.tsx` metadata
- [x] **robots.txt** — `app/robots.ts` implemented (allows public event pages, disallows admin/api)
- [x] **Sitemap** — `app/sitemap.ts` lists public event pages and static routes
- [ ] **Canonical URLs** — add canonical link tag to event pages to prevent duplicate-content issues

---

## High — UX & Feedback

- [ ] **Toast notifications** — replace silent success/error states with a toast system (sonner or react-hot-toast); wire to RSVP, share, copy-invite, payment success
- [ ] **Empty states** — design empty-state UI when no events are found in the radius (suggest widening radius or creating an event)
- [ ] **Form validation messages** — show inline field errors on event creation form (currently only shows a single top-level error string)
- [ ] **Confirm dialogs** — confirm before destructive actions (delete event, cancel RSVP)
- [ ] **Logout button** — verify a visible sign-out option exists in the profile/nav; add if missing
- [ ] **Event deletion** — let organizers delete their own events (API + UI); cascade-delete RSVPs/likes/reminders

---

## Medium — Features

- [x] **Event editing** — `app/(user)/events/[id]/edit/` page implemented
- [x] **Ticket system** — RSVPs generate a unique `ticketId`; `/tickets/[rsvpId]` page shows digital ticket; `/api/tickets/[rsvpId]` serves ticket data
- [ ] **Attendance check-in** — organisers mark attendees as attended (QR scan or manual); updates engagement score
- [ ] **User avatar upload** — profile page image upload using same `/api/upload` pattern (folder: `ilaka/avatars`)
- [ ] **Event image in reminder email** — include event banner in the reminder email HTML for better engagement
- [ ] **Event capacity enforcement** — block RSVP when `rsvpCount >= capacity` (currently UI shows warning but API may still accept)
- [ ] **Pagination / infinite scroll** — `/api/events` currently returns up to 200 events; add cursor-based pagination for the list view
- [ ] **Text search fallback** — when OpenAI/Pinecone is not configured, fall back to `ILIKE` full-text search on title/description instead of returning empty results
- [ ] **Share event** — implement the share flow end-to-end (native share API on mobile, copy link on desktop); currently Share row is written but UI may be incomplete

---

## Medium — Performance

- [ ] **next/image for event banners** — audit `ResilientImage` and event card images; switch to `next/image` with explicit `width`/`height` for LCP improvement
- [ ] **Font optimisation** — verify Fraunces and any other custom fonts use `next/font` with `display: swap`
- [ ] **Bundle analysis** — run `ANALYZE=true npm run build` (add `@next/bundle-analyzer`) and eliminate large unused dependencies
- [ ] **Lighthouse audit** — run against landing, discover, and event detail; target 90+ on Performance and Accessibility

---

## Medium — Observability

- [ ] **Error tracking** — integrate Sentry (or similar); capture unhandled exceptions in API routes and client components
- [ ] **Structured logging** — replace `console.error` with a structured logger (pino) that outputs JSON in production
- [ ] **Cron job monitoring** — add a ping to a dead-man's-switch service (e.g. BetterUptime, Healthchecks.io) at the end of `/api/cron/reminders` so alerts fire if reminders stop running
- [ ] **Database slow-query logging** — enable Prisma query logging in production to catch N+1 or missing-index problems

---

## Low — Developer Experience

- [ ] **CI pipeline** — add GitHub Actions workflow: lint → type-check (`tsc --noEmit`) → build on every PR
- [ ] **Environment example** — keep `.env.example` up to date with all current vars (`SMTP_*`, `CRON_SECRET`, `HEALTH_SECRET`, `DIRECT_URL`, etc.)
- [ ] **Migration script** — document the `prisma:deploy` + `prisma:generate` steps in a `scripts/deploy.sh` for production deploys
- [ ] **Seed script** — create a `prisma/seed.ts` with realistic test data (users, events near a configurable city) for staging environment setup

---

## Low — Accessibility

- [ ] **ARIA labels on icon-only buttons** — map expand/collapse, RSVP, and card action buttons need `aria-label`
- [ ] **Keyboard navigation on map** — ensure event markers are focusable and respond to Enter/Space
- [ ] **Colour contrast audit** — verify `--muted` text on light backgrounds meets WCAG AA (4.5:1 ratio)
- [ ] **Focus ring visibility** — ensure all interactive elements have a visible focus ring (`:focus-visible`)
