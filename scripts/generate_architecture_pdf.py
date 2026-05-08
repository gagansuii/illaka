"""Generates ILAAKA architecture overview PDF."""
from fpdf import FPDF, XPos, YPos
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "ILAAKA_Architecture.pdf")

DARK_BG   = (15, 15, 25)
CARD_BG   = (24, 24, 40)
ACCENT    = (99, 102, 241)   # indigo-500
TEXT      = (220, 220, 235)
MUTED     = (140, 140, 165)
GREEN     = (52, 211, 153)
YELLOW    = (251, 191, 36)
RED       = (248, 113, 113)


class PDF(FPDF):
    def header(self):
        self.set_fill_color(*DARK_BG)
        self.rect(0, 0, 210, 15, "F")
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*ACCENT)
        self.set_y(4)
        self.cell(0, 7, "ILAAKA -- Architecture Overview", align="C")

    def footer(self):
        self.set_fill_color(*DARK_BG)
        self.rect(0, 284, 210, 13, "F")
        self.set_y(-10)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*MUTED)
        self.cell(0, 6, f"Page {self.page_no()}", align="C")


def section_title(pdf: PDF, title: str):
    pdf.ln(4)
    pdf.set_fill_color(*ACCENT)
    pdf.rect(pdf.get_x(), pdf.get_y(), 3, 7, "F")
    pdf.set_x(pdf.get_x() + 5)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*TEXT)
    pdf.cell(0, 7, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)


def divider(pdf: PDF):
    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(0.3)
    pdf.line(pdf.l_margin, pdf.get_y(), 210 - pdf.r_margin, pdf.get_y())
    pdf.ln(3)


def card(pdf: PDF, rows: list[tuple[str, str]], col1_w: int = 55):
    """Render a two-column table card."""
    pdf.set_fill_color(*CARD_BG)
    pdf.set_font("Helvetica", "", 9)
    row_h = 6
    for label, value in rows:
        x, y = pdf.get_x(), pdf.get_y()
        pdf.rect(x, y, 210 - pdf.l_margin - pdf.r_margin, row_h, "F")
        pdf.set_text_color(*MUTED)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(col1_w, row_h, label)
        pdf.set_text_color(*TEXT)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, row_h, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)


def code_block(pdf: PDF, lines: list[str]):
    pdf.set_fill_color(*CARD_BG)
    pdf.set_font("Courier", "", 7.5)
    pdf.set_text_color(*GREEN)
    for line in lines:
        x, y = pdf.get_x(), pdf.get_y()
        pdf.rect(x, y, 210 - pdf.l_margin - pdf.r_margin, 5, "F")
        pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)


def bullet(pdf: PDF, items: list[tuple[str, str]]):
    for label, desc in items:
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.set_text_color(*ACCENT)
        pdf.cell(3, 5.5, "*")
        pdf.set_text_color(*TEXT)
        pdf.cell(42, 5.5, label)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(*MUTED)
        pdf.multi_cell(0, 5.5, desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def note(pdf: PDF, text: str, color=YELLOW):
    pdf.set_fill_color(*CARD_BG)
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.4)
    pdf.rect(pdf.l_margin, pdf.get_y(), 210 - pdf.l_margin - pdf.r_margin, 8, "FD")
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(*color)
    pdf.cell(4, 8, "")
    pdf.cell(0, 8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)


pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=14)
pdf.add_page()
pdf.set_fill_color(*DARK_BG)
pdf.rect(0, 0, 210, 297, "F")
pdf.set_margins(14, 18, 14)

# -- TITLE PAGE --------------------------------------------------------------
pdf.set_y(30)
pdf.set_fill_color(*ACCENT)
pdf.rect(14, 28, 182, 1, "F")

pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(*TEXT)
pdf.cell(0, 14, "ILAAKA", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

pdf.set_font("Helvetica", "", 13)
pdf.set_text_color(*MUTED)
pdf.cell(0, 8, "Architecture Overview", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(*ACCENT)
pdf.cell(0, 7, "Location-based community events platform", align="C",
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)

pdf.set_fill_color(*ACCENT)
pdf.rect(14, pdf.get_y() + 3, 182, 1, "F")
pdf.ln(12)

# Tagline card
pdf.set_fill_color(*CARD_BG)
pdf.rect(14, pdf.get_y(), 182, 22, "F")
pdf.set_y(pdf.get_y() + 4)
pdf.set_x(20)
pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(*TEXT)
pdf.cell(0, 6, "What is ILAAKA?")
pdf.ln(7)
pdf.set_x(20)
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(*MUTED)
pdf.multi_cell(170, 5.5,
    "A relevance-first event discovery platform. Users discover nearby events via "
    "a ranked feed (proximity + engagement + AI). Organizers create, manage, and "
    "monetize events. Supports geospatial queries, vector search, payments, and media.")
pdf.ln(8)

# -- SECTION 1 -- TECH STACK --------------------------------------------------
section_title(pdf, "1. Tech Stack")
divider(pdf)

card(pdf, [
    ("Framework",    "Next.js 16+ (App Router, TypeScript)"),
    ("Database",     "PostgreSQL + PostGIS (geospatial geography columns)"),
    ("ORM",          "Prisma with GiST index for radius queries"),
    ("Auth",         "NextAuth -- Credentials provider, JWT (id + role)"),
    ("Styling",      "Tailwind CSS + Radix UI primitives"),
    ("Payments",     "Razorpay (order creation + HMAC webhook verification)"),
    ("Media",        "Cloudinary (upload, resize, CDN delivery)"),
    ("AI Search",    "OpenAI text-embedding-3-small + Pinecone (cosine index)"),
    ("Rate Limiting","Redis (ioredis) with silent in-memory LRU fallback"),
    ("Email",        "Nodemailer"),
    ("Animation",    "Framer Motion, GSAP, Three.js"),
    ("Backend (alt)","FastAPI (Python) -- separate service at /backend/"),
])

# -- SECTION 2 -- DIRECTORY STRUCTURE -----------------------------------------
section_title(pdf, "2. Directory Structure")
divider(pdf)

code_block(pdf, [
    "D:/illaka/",
    "  app/                   Next.js App Router root",
    "    (auth)/              login, register, forgot/reset-password",
    "    (user)/              authenticated pages",
    "      discover/          main event feed (default screen)",
    "      events/[id]/       event detail",
    "      events/new/        create event form",
    "      my-events/         organizer's own events",
    "      tickets/[rsvpId]/  user's RSVPs / QR tickets",
    "      profile/           user profile",
    "    (admin)/admin/       admin panel",
    "    organizer/           organizer dashboard",
    "    api/                 all API route handlers",
    "  components/            shared React components",
    "    ui/                  primitives (button, card, dialog...)",
    "  lib/                   server-side utilities",
    "  sections/              landing page sections",
    "  prisma/                schema + migrations",
    "  three/                 Three.js 3D scene files",
    "  backend/               FastAPI Python service",
])

# -- SECTION 3 -- DATA MODEL ---------------------------------------------------
section_title(pdf, "3. Data Model")
divider(pdf)

pdf.set_font("Helvetica", "", 8.5)
pdf.set_text_color(*MUTED)
pdf.multi_cell(0, 5.5, "Core entities and their relationships:")
pdf.ln(2)

code_block(pdf, [
    "User  --(organizer)-->  Event  <--  RSVP       --  User",
    "                          |    <--  Like       --  User",
    "                          |    <--  Share      --  User",
    "                          |    <--  Attendance --  User",
    "                          +--  Payment  (via Razorpay)",
    "",
    "Event.location     = PostGIS geography(Point) -- GiST indexed",
    "Event.engagementScore = atomic INT updated via single SQL UPDATE",
])

card(pdf, [
    ("User roles",       "USER | ORGANIZER | ADMIN"),
    ("Event visibility", "PUBLIC | PRIVATE"),
    ("Event type",       "PHYSICAL | ONLINE"),
    ("engagementScore",  "RSVPx3  +  Likex1  +  Sharex5  +  Attendancex10"),
    ("PostGIS column",   "Unsupported('geography') -- queried with ST_DWithin"),
])

# -- SECTION 4 -- API ROUTES ---------------------------------------------------
pdf.add_page()
pdf.set_fill_color(*DARK_BG)
pdf.rect(0, 0, 210, 297, "F")

section_title(pdf, "4. API Routes  (app/api/)")
divider(pdf)

bullet(pdf, [
    ("events/",            "GET geo-filtered list, POST create"),
    ("events/[id]/",       "GET detail, PATCH update, DELETE"),
    ("events/[id]/rsvp",   "POST join / DELETE cancel RSVP"),
    ("events/[id]/share",  "POST -- increments share engagement score"),
    ("events/mine/",       "GET organizer's own events"),
    ("ai-search/",         "POST -- embed query -> Pinecone -> geo post-filter"),
    ("auth/register",      "POST -- bcrypt hash, create User"),
    ("auth/[...nextauth]", "NextAuth handler (sign-in, session, JWT)"),
    ("auth/forgot-password", "POST -- generate PasswordResetToken, send email"),
    ("auth/reset-password",  "POST -- verify token, update bcrypt hash"),
    ("payments/initiate",  "POST -- create Razorpay order"),
    ("payments/webhook",   "POST -- verify HMAC signature, record Payment row"),
    ("upload/",            "POST -- stream file to Cloudinary, return URL"),
    ("geo/ip/",            "GET -- resolve client IP -> lat/lng"),
    ("users/profile",      "GET / PATCH profile data"),
    ("users/location",     "PATCH -- save user's lat/lng preference"),
    ("users/members",      "GET -- community members list"),
    ("admin/events/",      "GET all events, DELETE any (ADMIN only)"),
    ("admin/users/",       "GET all users, PATCH role (ADMIN only)"),
    ("cron/cleanup-events","DELETE past events (Vercel cron job)"),
    ("cron/reminders",     "POST -- send reminder emails before events"),
    ("health/",            "GET -- liveness check"),
])

note(pdf, "All routes: validate with Zod  ->  rateLimit()  ->  getServerSession()  ->  NextResponse.json()")

# -- SECTION 5 -- LIB UTILITIES ------------------------------------------------
section_title(pdf, "5. lib/ -- Server Utilities")
divider(pdf)

card(pdf, [
    ("prisma.ts",        "Singleton Prisma client (avoids connection pool exhaustion)"),
    ("auth.ts",          "NextAuth config -- Credentials provider, JWT with id + role"),
    ("geo.ts",           "IP->coordinates via ipinfo.io then ip-api.com fallback; circuit breaker (3 failures -> 60s open)"),
    ("engagement.ts",    "Atomic SQL UPDATE for engagementScore -- no race conditions"),
    ("events-cache.ts",  "In-memory geo-bucketed cache -- 100m buckets, max 500 entries"),
    ("ai-cache.ts",      "In-memory cache for AI search results"),
    ("rate-limit.ts",    "Redis (ioredis) with LRU in-memory fallback; Redis failures auto-disable"),
    ("config.ts",        "getEnv() / getEnvOptional() / getEnvNumber() -- throws clearly on missing vars"),
    ("mailer.ts",        "Nodemailer wrapper for transactional emails"),
    ("media.ts",         "Cloudinary upload/delete helpers"),
    ("razorpay.ts",      "Razorpay client singleton"),
    ("database-errors.ts","Prisma error normalisation utilities"),
])

# -- SECTION 6 -- REQUEST FLOWS ------------------------------------------------
section_title(pdf, "6. Key Request Flows")
divider(pdf)

pdf.set_font("Helvetica", "B", 9)
pdf.set_text_color(*ACCENT)
pdf.cell(0, 6, "A) Event Discovery", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

code_block(pdf, [
    "Browser",
    "  1. GET /api/geo/ip              resolve lat/lng from IP",
    "  2. GET /api/events?lat=&lng=&radius=",
    "       rateLimit()",
    "       events-cache lookup (geo-bucket hit?)",
    "       Prisma: ST_DWithin(location, point, radius)",
    "       rank by:  proximity  >  engagementScore  >  recency",
    "       cache result",
    "       return ranked list",
])

pdf.set_font("Helvetica", "B", 9)
pdf.set_text_color(*ACCENT)
pdf.cell(0, 6, "B) AI Semantic Search", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

code_block(pdf, [
    "POST /api/ai-search  { query, lat, lng, radius }",
    "  ai-cache lookup (query hash hit?)",
    "  OpenAI text-embedding-3-small  ->  1536-dim vector",
    "  Pinecone query  (ilaka-events index, cosine metric)",
    "  post-filter results by ST_DWithin radius",
    "  rank: Pinecone score x 0.7  +  engagementScore x 0.3",
    "  cache -> return",
])

pdf.set_font("Helvetica", "B", 9)
pdf.set_text_color(*ACCENT)
pdf.cell(0, 6, "C) Payment Flow", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

code_block(pdf, [
    "POST /api/payments/initiate  { eventId, userId }",
    "  create Razorpay order  ->  return { orderId, amount, key }",
    "  frontend: open Razorpay checkout modal",
    "  on success: Razorpay calls POST /api/payments/webhook",
    "  webhook: verify HMAC(orderId + paymentId, secret)",
    "  record Payment row  +  create RSVP",
])

# -- SECTION 7 -- MIDDLEWARE & AUTH ---------------------------------------------
section_title(pdf, "7. Middleware & Auth")
divider(pdf)

pdf.set_font("Helvetica", "", 8.5)
pdf.set_text_color(*TEXT)
pdf.multi_cell(0, 5.5,
    "proxy.ts acts as the Next.js 16 middleware (replaces middleware.ts -- "
    "both cannot coexist). It protects /admin/*, /profile, and /events/new, "
    "redirecting unauthenticated users to /login.")
pdf.ln(3)

card(pdf, [
    ("Protected routes",  "/admin/*  /profile  /events/new"),
    ("Redirect target",   "/login"),
    ("Token storage",     "JWT in cookie (managed by NextAuth)"),
    ("JWT payload",       "{ id: string, role: USER | ORGANIZER | ADMIN }"),
    ("Password hashing",  "bcryptjs"),
    ("Admin check",       "role === 'ADMIN' verified server-side in each admin route"),
])

note(pdf, "Never create middleware.ts alongside proxy.ts -- Next.js 16 throws a conflict error.", RED)

# -- SECTION 8 -- CACHING STRATEGY ---------------------------------------------
section_title(pdf, "8. Caching Strategy")
divider(pdf)

card(pdf, [
    ("events-cache",    "Geo-bucketed in-memory cache. Buckets = floor(lat/0.001) + floor(lng/0.001). Max 500 entries. Fast nearby lookups without DB hit."),
    ("ai-cache",        "In-memory map keyed by query hash. Avoids redundant OpenAI + Pinecone calls for repeated queries."),
    ("Rate limit cache","LRU in-memory map used when Redis is unavailable. Degraded but non-crashing."),
])

# -- SECTION 9 -- ENV VARS -----------------------------------------------------
section_title(pdf, "9. Environment Variables")
divider(pdf)

card(pdf, [
    ("DATABASE_URL",           "PostgreSQL connection (Prisma pooled)"),
    ("DIRECT_URL",             "PostgreSQL direct connection (migrations)"),
    ("NEXTAUTH_SECRET",        "Required in production for JWT signing"),
    ("OPENAI_API_KEY",         "Optional -- AI search disabled if absent"),
    ("PINECONE_API_KEY",       "Optional -- AI search disabled if absent"),
    ("PINECONE_INDEX",         "Pinecone index name (ilaka-events)"),
    ("CLOUDINARY_CLOUD_NAME",  "Cloudinary credentials (3 vars)"),
    ("RAZORPAY_KEY_ID",        "Razorpay credentials (3 vars)"),
    ("REDIS_URL",              "Optional -- in-memory fallback if absent"),
    ("IPINFO_TOKEN",           "Optional -- ip-api.com fallback if absent"),
    ("CRON_SECRET",            "Shared secret for Vercel cron route auth"),
])

note(pdf, "Use lib/config.ts getEnv() for all server-side env access -- throws clearly on missing required vars.")

# -- SECTION 10 -- DESIGN DECISIONS --------------------------------------------
pdf.add_page()
pdf.set_fill_color(*DARK_BG)
pdf.rect(0, 0, 210, 297, "F")

section_title(pdf, "10. Key Design Decisions")
divider(pdf)

bullet(pdf, [
    ("Feed-first",       "Default UI is a ranked scrollable feed. Map is an optional toggle for spatial exploration -- not the primary interface."),
    ("proxy.ts",         "Acts as Next.js 16 middleware instead of middleware.ts. Both files cannot coexist in Next.js 16+."),
    ("PostGIS",          "ST_DWithin on a geography column with a GiST index makes radius queries fast without application-side filtering."),
    ("Atomic engagement","Single SQL UPDATE for engagementScore avoids race conditions that multiple COUNT queries would cause."),
    ("Dual caching",     "Separate geo-bucketed cache for events and a query-hash cache for AI results -- each optimised for its access pattern."),
    ("Graceful degradation", "Redis failure -> in-memory LRU. IP geolocation failure -> fallback provider. AI keys absent -> feature disabled. App never crashes due to optional services."),
    ("Zod everywhere",   "All API inputs validated with Zod before any DB or service call -- no silent type coercion issues."),
    ("Event ranking",    "Proximity (strongest weight) + engagementScore + recency. AI semantic relevance added on top when search is active."),
])

# -- SECTION 11 -- COMPONENTS --------------------------------------------------
section_title(pdf, "11. Key Components")
divider(pdf)

bullet(pdf, [
    ("MapScreen.tsx",           "Leaflet map -- secondary exploration mode, synced to same feed dataset"),
    ("SwipeDeck.tsx",           "Tinder-style swipe UI for event browsing"),
    ("EventDetailClient.tsx",   "Full event detail with RSVP, payment, share"),
    ("PaymentButton.tsx",       "Razorpay checkout trigger -- handles order init + modal"),
    ("OrganizerDashboard.tsx",  "Analytics and management view for organizers"),
    ("EventPreviewDrawer.tsx",  "Bottom-sheet event preview on map pin tap"),
    ("TopNav / BottomNav",      "Navigation bars with role-aware links"),
    ("RouteTransitionProvider", "Page transition animations via Framer Motion"),
    ("ThemeProvider.tsx",       "next-themes dark/light mode wrapper"),
    ("ResilientImage.tsx",      "next/image wrapper with Cloudinary fallback"),
])

# -- done ---------------------------------------------------------------------
pdf.output(OUT)
print(f"PDF written to: {OUT}")
