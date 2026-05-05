"""
WebSocket connection manager with Redis pub/sub fan-out.

Architecture:
  - Each FastAPI instance holds a dict of active WebSocket connections.
  - When a message/notification is published, it goes to Redis pub/sub.
  - A background subscriber loop on each instance listens to the channels
    it cares about and forwards messages to locally connected sockets.
  - This means horizontal scaling works: a notification published from
    instance A reaches a user connected to instance B.

Channels:
  - user:{user_id}:notifications  → personal notifications
  - room:{room_id}:messages       → chat room messages
"""
import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # user_id → set of active WebSocket connections
        self._user_connections: dict[str, set[WebSocket]] = defaultdict(set)
        # room_id → set of active WebSocket connections
        self._room_connections: dict[str, set[WebSocket]] = defaultdict(set)
        # WebSocket → user_id (reverse index for cleanup)
        self._ws_user: dict[WebSocket, str] = {}
        # WebSocket → set of room_ids
        self._ws_rooms: dict[WebSocket, set[str]] = defaultdict(set)
        self._lock = asyncio.Lock()
        self._subscriber_task: asyncio.Task | None = None

    async def connect(self, ws: WebSocket, user_id: str) -> None:
        await ws.accept()
        async with self._lock:
            self._user_connections[user_id].add(ws)
            self._ws_user[ws] = user_id
        logger.debug("WS connect: user=%s total=%d", user_id, len(self._user_connections[user_id]))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            user_id = self._ws_user.pop(ws, None)
            if user_id:
                self._user_connections[user_id].discard(ws)
                if not self._user_connections[user_id]:
                    del self._user_connections[user_id]
            for room_id in self._ws_rooms.pop(ws, set()):
                self._room_connections[room_id].discard(ws)
                if not self._room_connections[room_id]:
                    del self._room_connections[room_id]
        if user_id:
            logger.debug("WS disconnect: user=%s", user_id)

    async def join_room(self, ws: WebSocket, room_id: str) -> None:
        async with self._lock:
            self._room_connections[room_id].add(ws)
            self._ws_rooms[ws].add(room_id)

    async def leave_room(self, ws: WebSocket, room_id: str) -> None:
        async with self._lock:
            self._room_connections[room_id].discard(ws)
            self._ws_rooms[ws].discard(room_id)

    async def send_to_user(self, user_id: str, payload: dict[str, Any]) -> None:
        """Send directly to locally connected sockets for this user."""
        sockets = list(self._user_connections.get(user_id, set()))
        data = json.dumps(payload)
        dead = []
        for ws in sockets:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    async def broadcast_to_room(self, room_id: str, payload: dict[str, Any]) -> None:
        """Broadcast to all locally connected sockets in a room."""
        sockets = list(self._room_connections.get(room_id, set()))
        data = json.dumps(payload)
        dead = []
        for ws in sockets:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    # ── Redis pub/sub subscriber ──────────────────────────────────────────────

    def start_subscriber(self) -> None:
        if self._subscriber_task is None or self._subscriber_task.done():
            self._subscriber_task = asyncio.create_task(self._redis_subscriber_loop())

    def stop_subscriber(self) -> None:
        if self._subscriber_task and not self._subscriber_task.done():
            self._subscriber_task.cancel()

    async def _redis_subscriber_loop(self) -> None:
        """
        Subscribe to Redis pub/sub channels for all connected users and rooms.
        Re-subscribes automatically when connections change.
        Pattern subscriptions cover all user and room channels at once.
        """
        try:
            from app.caching.redis_client import cache
            r = await cache._get_redis()
            if not r:
                logger.warning("Redis unavailable — WS fan-out disabled")
                return

            pubsub = r.pubsub()
            await pubsub.psubscribe("user:*:notifications", "room:*:messages")
            logger.info("WS subscriber listening on Redis pub/sub")

            async for message in pubsub.listen():
                if message["type"] not in ("pmessage", "message"):
                    continue
                channel: str = message.get("channel", "")
                raw: str = message.get("data", "{}")
                try:
                    payload = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                if channel.startswith("user:"):
                    parts = channel.split(":")
                    user_id = parts[1] if len(parts) >= 2 else None
                    if user_id:
                        await self.send_to_user(user_id, payload)
                elif channel.startswith("room:"):
                    parts = channel.split(":")
                    room_id = parts[1] if len(parts) >= 2 else None
                    if room_id:
                        await self.broadcast_to_room(room_id, payload)

        except asyncio.CancelledError:
            logger.info("WS subscriber cancelled")
        except Exception as exc:
            logger.error("WS subscriber error: %s", exc, exc_info=True)

    async def publish_to_room(self, room_id: str, payload: dict[str, Any]) -> None:
        """Publish a chat message to Redis so all WS instances receive it."""
        try:
            from app.caching.redis_client import cache
            r = await cache._get_redis()
            if r:
                await r.publish(f"room:{room_id}:messages", json.dumps(payload))
            else:
                # Fallback: broadcast only to locally connected sockets
                await self.broadcast_to_room(room_id, payload)
        except Exception as exc:
            logger.warning("Room publish failed: %s", exc)
            await self.broadcast_to_room(room_id, payload)


manager = ConnectionManager()
