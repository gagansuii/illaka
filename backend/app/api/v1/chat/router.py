"""
Chat HTTP endpoints (room management, message history).
Real-time messaging is handled by the /ws WebSocket endpoint in main.py.
"""
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.caching.redis_client import cache
from app.core.exceptions import RateLimitError
from app.database.session import get_db
from app.models.chat.room import ChatRoom
from app.models.chat.message import ChatMessage
from app.models.chat.room_member import RoomMember
from app.models.user import User
from app.core.exceptions import ForbiddenError, NotFoundError
from app.schemas.chat import RoomCreate, RoomResponse, MessagePage, MessageResponse
from app.models.base import generate_uuid

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/rooms", response_model=RoomResponse, status_code=201)
async def create_room(
    data: RoomCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await cache.rate_limit(f"create_room:{current_user.id}", limit=5, window=60):
        raise RateLimitError("Too many room creation requests")
    room = ChatRoom(
        id=generate_uuid(),
        name=data.name,
        room_type=data.room_type,
        description=data.description,
        created_by=current_user.id,
        member_count=1 + len(data.member_ids),
    )
    db.add(room)
    await db.flush()

    # Add creator
    db.add(RoomMember(room_id=room.id, user_id=current_user.id, is_admin=True))
    # Add invited members
    for uid in set(data.member_ids):
        if uid != current_user.id:
            db.add(RoomMember(room_id=room.id, user_id=uid))
    await db.flush()
    return room


@router.get("/rooms", response_model=list[RoomResponse])
async def list_my_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatRoom)
        .join(RoomMember, RoomMember.room_id == ChatRoom.id)
        .where(RoomMember.user_id == current_user.id, ChatRoom.is_active.is_(True))
        .order_by(ChatRoom.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/rooms/{room_id}/messages", response_model=MessagePage)
async def get_messages(
    room_id: str,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify membership
    member = (await db.execute(
        select(RoomMember).where(
            RoomMember.room_id == room_id, RoomMember.user_id == current_user.id
        )
    )).scalar_one_or_none()
    if not member:
        raise ForbiddenError("Not a member of this room")

    q = (
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit + 1)
    )
    if cursor:
        from datetime import datetime
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            q = q.where(ChatMessage.created_at < cursor_dt)
        except ValueError:
            pass

    rows = (await db.execute(q)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    # Bulk-load sender info
    sender_ids = {m.sender_id for m in rows if m.sender_id}
    senders: dict[str, User] = {}
    if sender_ids:
        sr = await db.execute(select(User).where(User.id.in_(sender_ids)))
        senders = {u.id: u for u in sr.scalars().all()}

    messages = [
        MessageResponse(
            id=m.id,
            room_id=m.room_id,
            sender_id=m.sender_id,
            sender_name=senders[m.sender_id].name if m.sender_id in senders else None,
            sender_avatar=senders[m.sender_id].avatar_url if m.sender_id in senders else None,
            message_type=m.message_type,
            content=m.content,
            media_data=m.media_data,
            reply_to_id=m.reply_to_id,
            reactions=m.reactions,
            is_deleted=m.is_deleted,
            created_at=m.created_at,
        )
        for m in rows
    ]
    next_cursor = rows[-1].created_at.isoformat() if (has_more and rows) else None
    return MessagePage(messages=messages, next_cursor=next_cursor, has_more=has_more)


@router.post("/rooms/{room_id}/members/{user_id}")
async def add_member(
    room_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    actor = (await db.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == current_user.id)
    )).scalar_one_or_none()
    if not actor or not actor.is_admin:
        raise ForbiddenError("Only room admins can add members")

    existing = (await db.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
    )).scalar_one_or_none()
    if not existing:
        db.add(RoomMember(room_id=room_id, user_id=user_id))
        room = (await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))).scalar_one()
        room.member_count += 1
    return {"ok": True}
