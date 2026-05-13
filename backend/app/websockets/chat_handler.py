"""
WebSocket endpoint handler for chat and real-time notifications.

Single endpoint: /ws/{user_id}?token=<jwt>

The client sends JSON messages using WSIncoming schema.
The server pushes JSON messages using WSOutgoing schema.

Supported actions:
  join_room     → subscribe to a chat room's broadcasts
  leave_room    → unsubscribe from a chat room
  send_message  → save message + broadcast to room
  typing        → broadcast typing indicator (not persisted)
  read          → mark messages as read in a room
  react         → add emoji reaction to a message
  ping          → keepalive, server replies pong
"""
import logging
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.chat import WSIncoming, WSOutgoing
from app.websockets.manager import manager

logger = logging.getLogger(__name__)


async def handle_connection(ws: WebSocket, user_id: str, db: AsyncSession) -> None:
    await manager.connect(ws, user_id)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                incoming = WSIncoming.model_validate_json(raw)
            except Exception:
                await _send(ws, WSOutgoing(event="error", data={"message": "Invalid message format"}))
                continue

            await _dispatch(ws, user_id, incoming, db)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.exception("WS handler error for user %s: %s", user_id, exc)
    finally:
        await manager.disconnect(ws)


async def _dispatch(
    ws: WebSocket, user_id: str, msg: WSIncoming, db: AsyncSession
) -> None:
    action = msg.action

    if action == "ping":
        await _send(ws, WSOutgoing(event="pong", data={"ts": datetime.now(timezone.utc).isoformat()}))

    elif action == "join_room":
        room_id = msg.room_id or msg.data.get("room_id")
        if room_id:
            await manager.join_room(ws, room_id)
            await _send(ws, WSOutgoing(event="joined_room", data={"room_id": room_id}))

    elif action == "leave_room":
        room_id = msg.room_id or msg.data.get("room_id")
        if room_id:
            await manager.leave_room(ws, room_id)
            await _send(ws, WSOutgoing(event="left_room", data={"room_id": room_id}))

    elif action == "send_message":
        room_id = msg.room_id or msg.data.get("room_id")
        content = msg.data.get("content", "").strip()
        reply_to = msg.data.get("reply_to_id")
        if not room_id or not content:
            await _send(ws, WSOutgoing(event="error", data={"message": "room_id and content required"}))
            return
        await _handle_send_message(ws, user_id, room_id, content, reply_to, db)

    elif action == "typing":
        room_id = msg.room_id or msg.data.get("room_id")
        if room_id:
            await manager.publish_to_room(room_id, {
                "event": "typing",
                "data": {"user_id": user_id, "room_id": room_id},
            })

    elif action == "read":
        room_id = msg.room_id or msg.data.get("room_id")
        if room_id:
            await _handle_read(user_id, room_id, db)

    elif action == "react":
        message_id = msg.data.get("message_id")
        emoji = msg.data.get("emoji", "❤️")
        room_id = msg.room_id or msg.data.get("room_id")
        if message_id and room_id:
            await _handle_react(user_id, message_id, emoji, room_id, db)

    else:
        await _send(ws, WSOutgoing(event="error", data={"message": f"Unknown action: {action}"}))


async def _handle_send_message(
    ws: WebSocket, user_id: str, room_id: str, content: str,
    reply_to_id: str | None, db: AsyncSession
) -> None:
    from sqlalchemy import select
    from app.models.chat.message import ChatMessage
    from app.models.chat.room_member import RoomMember

    # Verify membership
    member = (await db.execute(
        select(RoomMember).where(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user_id,
            RoomMember.is_muted.is_(False),
        )
    )).scalar_one_or_none()

    if not member:
        await _send(ws, WSOutgoing(event="error", data={"message": "Not a member of this room"}))
        return

    # Save to DB
    msg = ChatMessage(
        room_id=room_id,
        sender_id=user_id,
        content=content,
        reply_to_id=reply_to_id,
    )
    db.add(msg)
    await db.flush()

    # Load sender name for broadcast
    from app.models.user import User
    sender = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()

    payload = {
        "event": "message",
        "data": {
            "id": msg.id,
            "room_id": room_id,
            "sender_id": user_id,
            "sender_name": sender.name if sender else None,
            "sender_avatar": sender.avatar_url if sender else None,
            "content": content,
            "reply_to_id": reply_to_id,
            "created_at": msg.created_at.isoformat(),
        },
    }
    await manager.publish_to_room(room_id, payload)


async def _handle_read(user_id: str, room_id: str, db: AsyncSession) -> None:
    from sqlalchemy import update
    from app.models.chat.room_member import RoomMember
    from datetime import timezone

    await db.execute(
        update(RoomMember)
        .where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
        .values(last_read_at=datetime.now(timezone.utc))
    )
    await db.flush()


async def _handle_react(
    user_id: str, message_id: str, emoji: str, room_id: str, db: AsyncSession
) -> None:
    from sqlalchemy import select
    from app.models.chat.message import ChatMessage

    msg = (await db.execute(select(ChatMessage).where(ChatMessage.id == message_id))).scalar_one_or_none()
    if not msg:
        return

    reactions = dict(msg.reactions or {})
    users = reactions.get(emoji, [])
    if user_id in users:
        users.remove(user_id)
    else:
        users.append(user_id)
    reactions[emoji] = users
    msg.reactions = reactions
    await db.flush()

    await manager.publish_to_room(room_id, {
        "event": "reaction",
        "data": {"message_id": message_id, "reactions": reactions, "room_id": room_id},
    })


async def _send(ws: WebSocket, payload: WSOutgoing) -> None:
    try:
        await ws.send_text(payload.model_dump_json())
    except Exception as exc:
        logger.debug("WS send failed: %s", exc)
