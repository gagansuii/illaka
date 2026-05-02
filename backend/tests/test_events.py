import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

AUTH_BASE = "/api/v1/auth"
EVENTS_BASE = "/api/v1/events"

_USER = {"name": "Organizer", "email": "organizer@example.com", "password": "Password1!"}
_EVENT = {
    "title": "Test Community Run",
    "description": "A great community running event for everyone",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "start_time": "2030-01-15T09:00:00",
    "end_time": "2030-01-15T11:00:00",
    "visibility": "PUBLIC",
    "capacity": 100,
    "is_paid": False,
    "event_type": "PHYSICAL",
}


async def _get_token(client: AsyncClient, email: str | None = None) -> str:
    user = {**_USER, "email": email or _USER["email"]}
    await client.post(f"{AUTH_BASE}/register", json=user)
    r = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": user["email"], "password": user["password"]},
    )
    return r.json()["access_token"]


async def test_create_event_requires_auth(client: AsyncClient):
    r = await client.post(EVENTS_BASE, json=_EVENT)
    assert r.status_code == 401


async def test_create_event_success(client: AsyncClient):
    token = await _get_token(client)
    r = await client.post(
        EVENTS_BASE,
        json=_EVENT,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    data = r.json()
    assert "event" in data
    assert data["event"]["title"] == _EVENT["title"]


async def test_get_event_by_id(client: AsyncClient):
    token = await _get_token(client, "get_event@example.com")
    created = await client.post(
        EVENTS_BASE,
        json={**_EVENT, "title": "Get Event Test"},
        headers={"Authorization": f"Bearer {token}"},
    )
    event_id = created.json()["event"]["id"]
    r = await client.get(f"{EVENTS_BASE}/{event_id}")
    assert r.status_code == 200
    assert r.json()["event"]["id"] == event_id


async def test_update_event_own(client: AsyncClient):
    token = await _get_token(client, "update@example.com")
    created = await client.post(
        EVENTS_BASE,
        json={**_EVENT, "title": "Update Me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    event_id = created.json()["event"]["id"]
    r = await client.put(
        f"{EVENTS_BASE}/{event_id}",
        json={"title": "Updated Title"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["event"]["title"] == "Updated Title"


async def test_delete_event_own(client: AsyncClient):
    token = await _get_token(client, "delete@example.com")
    created = await client.post(
        EVENTS_BASE,
        json={**_EVENT, "title": "Delete Me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    event_id = created.json()["event"]["id"]
    r = await client.delete(
        f"{EVENTS_BASE}/{event_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


async def test_private_event_not_accessible_without_auth(client: AsyncClient):
    token = await _get_token(client, "private@example.com")
    created = await client.post(
        EVENTS_BASE,
        json={**_EVENT, "title": "Private Event", "visibility": "PRIVATE"},
        headers={"Authorization": f"Bearer {token}"},
    )
    event_id = created.json()["event"]["id"]
    # Anonymous access should fail
    r = await client.get(f"{EVENTS_BASE}/{event_id}")
    assert r.status_code == 403


async def test_rsvp_to_event(client: AsyncClient):
    organizer = await _get_token(client, "rsvp_org@example.com")
    attendee = await _get_token(client, "rsvp_att@example.com")
    created = await client.post(
        EVENTS_BASE,
        json={**_EVENT, "title": "RSVP Event"},
        headers={"Authorization": f"Bearer {organizer}"},
    )
    event_id = created.json()["event"]["id"]
    r = await client.post(
        f"{EVENTS_BASE}/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {attendee}"},
    )
    assert r.status_code == 201
    assert "rsvp_id" in r.json()


async def test_duplicate_rsvp_rejected(client: AsyncClient):
    organizer = await _get_token(client, "dup_org@example.com")
    attendee = await _get_token(client, "dup_att@example.com")
    created = await client.post(
        EVENTS_BASE,
        json={**_EVENT, "title": "Dup RSVP Event"},
        headers={"Authorization": f"Bearer {organizer}"},
    )
    event_id = created.json()["event"]["id"]
    await client.post(f"{EVENTS_BASE}/{event_id}/rsvp", headers={"Authorization": f"Bearer {attendee}"})
    r = await client.post(f"{EVENTS_BASE}/{event_id}/rsvp", headers={"Authorization": f"Bearer {attendee}"})
    assert r.status_code == 409
