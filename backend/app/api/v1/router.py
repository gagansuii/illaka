from fastapi import APIRouter

from app.api.v1.admin.router import router as admin_router
from app.api.v1.ai.router import router as ai_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.cron.router import router as cron_router
from app.api.v1.events.router import router as events_router
from app.api.v1.geo.router import router as geo_router
from app.api.v1.health.router import router as health_router
from app.api.v1.payments.router import router as payments_router
from app.api.v1.tickets.router import router as tickets_router
from app.api.v1.uploads.router import router as uploads_router
from app.api.v1.users.router import router as users_router

v1_router = APIRouter(prefix="/api/v1")

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
