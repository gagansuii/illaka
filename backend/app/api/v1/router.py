from fastapi import APIRouter

from app.api.v1.admin.router import router as admin_router
from app.api.v1.ai.router import router as ai_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.chat.router import router as chat_router
from app.api.v1.community.router import router as community_router
from app.api.v1.companies.router import router as companies_router
from app.api.v1.cron.router import router as cron_router
from app.api.v1.events.router import router as events_router
from app.api.v1.feed.router import router as feed_router
from app.api.v1.gamification.router import router as gamification_router
from app.api.v1.geo.router import router as geo_router
from app.api.v1.health.router import router as health_router
from app.api.v1.keys.router import router as keys_router
from app.api.v1.notifications.router import router as notifications_router
from app.api.v1.payments.router import router as payments_router
from app.api.v1.social.router import router as social_router
from app.api.v1.tickets.router import router as tickets_router
from app.api.v1.uploads.router import router as uploads_router
from app.api.v1.users.router import router as users_router

v1_router = APIRouter(prefix="/api/v1")

# ── Core ──────────────────────────────────────────────────────────────────────
v1_router.include_router(auth_router)
v1_router.include_router(events_router)
v1_router.include_router(users_router)
v1_router.include_router(payments_router)
v1_router.include_router(admin_router)
v1_router.include_router(tickets_router)
v1_router.include_router(ai_router)
v1_router.include_router(uploads_router)
v1_router.include_router(geo_router)
v1_router.include_router(cron_router)
v1_router.include_router(health_router)

# ── B2B API management ────────────────────────────────────────────────────────
v1_router.include_router(companies_router)
v1_router.include_router(keys_router)

# ── Community ─────────────────────────────────────────────────────────────────
v1_router.include_router(social_router)
v1_router.include_router(feed_router)
v1_router.include_router(community_router)
v1_router.include_router(chat_router)
v1_router.include_router(notifications_router)
v1_router.include_router(gamification_router)
