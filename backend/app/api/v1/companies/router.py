import hashlib
import re
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.database.session import get_db
from app.models.company import ApiKey, Company, CompanyPlan
from app.models.user import User, UserRole

router = APIRouter(prefix="/companies", tags=["companies"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    name: str
    contact_email: EmailStr
    plan: CompanyPlan = CompanyPlan.FREE


class CompanyOut(BaseModel):
    id: str
    name: str
    slug: str
    contact_email: str
    plan: CompanyPlan
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class OnboardResponse(BaseModel):
    company: CompanyOut
    api_key: str  # raw key — shown once


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug[:80]


def _generate_api_key() -> tuple[str, str, str]:
    """Returns (raw_key, key_hash, prefix)."""
    raw = f"ik_{secrets.token_hex(32)}"
    key_hash = hashlib.sha256(raw.encode()).hexdigest()
    prefix = raw[:8]
    return raw, key_hash, prefix


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=OnboardResponse,
    summary="Onboard a new company (admin only)",
)
async def create_company(
    body: CompanyCreate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    slug = _slugify(body.name)

    # Ensure slug is unique
    existing = await db.execute(select(Company).where(Company.slug == slug))
    if existing.scalar_one_or_none():
        raise ConflictError(f"A company with slug '{slug}' already exists")

    # Create service user (role=ORGANIZER, not a real login account)
    service_email = f"api-service@{slug}.ilaaka.internal"
    svc_result = await db.execute(select(User).where(User.email == service_email))
    if svc_result.scalar_one_or_none():
        raise ConflictError(f"Service user for '{slug}' already exists")

    service_user = User(
        name=f"{body.name} (API)",
        email=service_email,
        password=hash_password(secrets.token_hex(32)),  # non-loginable
        role=UserRole.ORGANIZER,
        email_verified=True,
        is_active=True,
    )
    db.add(service_user)
    await db.flush()  # get service_user.id

    # Create company
    company = Company(
        name=body.name,
        slug=slug,
        contact_email=str(body.contact_email),
        plan=body.plan,
        service_user_id=service_user.id,
    )
    db.add(company)
    await db.flush()  # get company.id

    # Create first API key
    raw_key, key_hash, prefix = _generate_api_key()
    api_key = ApiKey(
        company_id=company.id,
        name="Default",
        key_hash=key_hash,
        prefix=prefix,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(company)

    return OnboardResponse(company=CompanyOut.model_validate(company), api_key=raw_key)


@router.get(
    "",
    response_model=list[CompanyOut],
    summary="List all companies (admin only)",
)
async def list_companies(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).order_by(Company.created_at.desc()))
    return [CompanyOut.model_validate(c) for c in result.scalars().all()]


@router.patch(
    "/{company_id}/deactivate",
    response_model=CompanyOut,
    summary="Deactivate a company (admin only) — all its API keys stop working immediately",
)
async def deactivate_company(
    company_id: str,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    company = await db.get(Company, company_id)
    if not company:
        raise NotFoundError("Company not found")

    # Deactivating service user blocks all API key auth for this company
    service_user = await db.get(User, company.service_user_id)
    if service_user:
        service_user.is_active = False

    company.is_active = False
    await db.commit()
    await db.refresh(company)
    return CompanyOut.model_validate(company)
