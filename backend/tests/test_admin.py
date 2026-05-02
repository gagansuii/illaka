import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import UserRole
from app.repositories import user_repo

pytestmark = pytest.mark.asyncio

AUTH_BASE = "/api/v1/auth"
ADMIN_BASE = "/api/v1/admin"

_ADMIN = {"name": "Admin User", "email": "admin@example.com", "password": "Password1!"}
_REGULAR = {"name": "Regular User", "email": "regular@example.com", "password": "Password1!"}


async def _make_admin(client: AsyncClient, db: AsyncSession) -> str:
    await client.post(f"{AUTH_BASE}/register", json=_ADMIN)
    admin_user = await user_repo.get_by_email(db, _ADMIN["email"])
    await user_repo.update_fields(db, admin_user.id, role=UserRole.ADMIN)
    await db.commit()
    r = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": _ADMIN["email"], "password": _ADMIN["password"]},
    )
    return r.json()["access_token"]


async def test_admin_list_users_requires_admin(client: AsyncClient):
    await client.post(f"{AUTH_BASE}/register", json=_REGULAR)
    r = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": _REGULAR["email"], "password": _REGULAR["password"]},
    )
    token = r.json()["access_token"]
    r = await client.get(f"{ADMIN_BASE}/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


async def test_admin_list_users_success(client: AsyncClient, db: AsyncSession):
    token = await _make_admin(client, db)
    r = await client.get(f"{ADMIN_BASE}/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert "users" in data
    assert "total" in data


async def test_admin_list_events(client: AsyncClient, db: AsyncSession):
    token = await _make_admin(client, db)
    r = await client.get(f"{ADMIN_BASE}/events", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert "events" in r.json()


async def test_admin_update_user_role(client: AsyncClient, db: AsyncSession):
    admin_token = await _make_admin(client, db)
    await client.post(
        f"{AUTH_BASE}/register",
        json={"name": "Promote Me", "email": "promote@example.com", "password": "Password1!"},
    )
    user = await user_repo.get_by_email(db, "promote@example.com")
    r = await client.patch(
        f"{ADMIN_BASE}/users/{user.id}",
        json={"role": "ORGANIZER"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "ORGANIZER"
