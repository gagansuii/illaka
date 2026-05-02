import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

BASE = "/api/v1/auth"

VALID_USER = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password1!",
}


async def test_register_success(client: AsyncClient):
    r = await client.post(f"{BASE}/register", json=VALID_USER)
    assert r.status_code == 201
    data = r.json()
    assert "id" in data


async def test_register_duplicate_email(client: AsyncClient):
    await client.post(f"{BASE}/register", json=VALID_USER)
    r = await client.post(f"{BASE}/register", json=VALID_USER)
    assert r.status_code == 409


async def test_register_weak_password(client: AsyncClient):
    r = await client.post(
        f"{BASE}/register",
        json={**VALID_USER, "email": "weak@example.com", "password": "password"},
    )
    assert r.status_code == 422


async def test_login_success(client: AsyncClient):
    await client.post(f"{BASE}/register", json=VALID_USER)
    r = await client.post(
        f"{BASE}/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient):
    await client.post(f"{BASE}/register", json=VALID_USER)
    r = await client.post(
        f"{BASE}/login",
        json={"email": VALID_USER["email"], "password": "WrongPass1!"},
    )
    assert r.status_code == 401


async def test_me_requires_auth(client: AsyncClient):
    r = await client.get(f"{BASE}/me")
    assert r.status_code == 401


async def test_me_with_valid_token(client: AsyncClient):
    await client.post(f"{BASE}/register", json={**VALID_USER, "email": "me@example.com"})
    login = await client.post(
        f"{BASE}/login",
        json={"email": "me@example.com", "password": VALID_USER["password"]},
    )
    token = login.json()["access_token"]
    r = await client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"


async def test_refresh_token(client: AsyncClient):
    await client.post(f"{BASE}/register", json={**VALID_USER, "email": "refresh@example.com"})
    login = await client.post(
        f"{BASE}/login",
        json={"email": "refresh@example.com", "password": VALID_USER["password"]},
    )
    refresh_token = login.json()["refresh_token"]
    r = await client.post(f"{BASE}/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_forgot_password_always_succeeds(client: AsyncClient):
    r = await client.post(f"{BASE}/forgot-password", json={"email": "nonexistent@example.com"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
