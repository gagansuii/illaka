import hashlib
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.database.session import get_db
from app.models.company import ApiKey, Company
from app.models.user import User

router = APIRouter(prefix="/keys", tags=["api-keys"])

MAX_KEYS_PER_COMPANY = 10


# ── Schemas ───────────────────────────────────────────────────────────────────

class KeyCreate(BaseModel):
    name: str
    company_id: str


class KeyOut(BaseModel):
    id: str
    company_id: str
    name: str
    prefix: str
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class KeyCreated(KeyOut):
    key: str  # raw key — shown once only


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_api_key() -> tuple[str, str, str]:
    raw = f"ik_{secrets.token_hex(32)}"
    key_hash = hashlib.sha256(raw.encode()).hexdigest()
    prefix = raw[:8]
    return raw, key_hash, prefix


async def _require_company_access(company_id: str, current_user: User, db: AsyncSession) -> Company:
    company = await db.get(Company, company_id)
    if not company:
        raise NotFoundError("Company not found")
    # Admin can manage any company; service user can only manage their own
    if current_user.role.value != "ADMIN" and company.service_user_id != current_user.id:
        raise ForbiddenError("You do not have access to this company")
    return company


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[KeyOut],
    summary="List API keys for a company",
)
async def list_keys(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_company_access(company_id, current_user, db)
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.company_id == company_id)
        .order_by(ApiKey.created_at.desc())
    )
    return [KeyOut.model_validate(k) for k in result.scalars().all()]


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=KeyCreated,
    summary="Create a new API key for a company (shown once)",
)
async def create_key(
    body: KeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_company_access(body.company_id, current_user, db)

    count_result = await db.execute(
        select(ApiKey).where(ApiKey.company_id == body.company_id)
    )
    if len(count_result.scalars().all()) >= MAX_KEYS_PER_COMPANY:
        raise ConflictError(f"Maximum of {MAX_KEYS_PER_COMPANY} API keys per company")

    raw_key, key_hash, prefix = _generate_api_key()
    api_key = ApiKey(
        company_id=body.company_id,
        name=body.name,
        key_hash=key_hash,
        prefix=prefix,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return KeyCreated(**KeyOut.model_validate(api_key).model_dump(), key=raw_key)


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an API key",
)
async def revoke_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    api_key = await db.get(ApiKey, key_id)
    if not api_key:
        raise NotFoundError("API key not found")

    await _require_company_access(api_key.company_id, current_user, db)
    await db.delete(api_key)
    await db.commit()
