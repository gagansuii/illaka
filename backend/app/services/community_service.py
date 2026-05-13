"""
EventCommunity service — one community per event, auto-created at event creation.
"""
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community.event_community import EventCommunity, CommunityMember, CommunityRole
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.schemas.community import EventCommunityResponse, CommunityJoinResponse


async def get_or_create_for_event(
    db: AsyncSession, event_id: str, event_name: str, organizer_id: str
) -> EventCommunity:
    """Called at event creation to bootstrap a community hub."""
    existing = (
        await db.execute(
            select(EventCommunity).where(EventCommunity.event_id == event_id)
        )
    ).scalar_one_or_none()

    if existing:
        return existing

    community = EventCommunity(
        event_id=event_id,
        name=event_name,
        member_count=1,
    )
    db.add(community)
    await db.flush()

    # Organizer is automatically admin
    db.add(CommunityMember(
        community_id=community.id,
        user_id=organizer_id,
        role=CommunityRole.ADMIN,
    ))
    await db.flush()
    return community


async def get_community(
    db: AsyncSession, community_id: str, viewer_id: str | None
) -> EventCommunityResponse:
    community = (
        await db.execute(select(EventCommunity).where(EventCommunity.id == community_id))
    ).scalar_one_or_none()
    if not community:
        raise NotFoundError("Community not found")

    is_member = False
    user_role = None
    if viewer_id:
        membership = (
            await db.execute(
                select(CommunityMember).where(
                    CommunityMember.community_id == community_id,
                    CommunityMember.user_id == viewer_id,
                )
            )
        ).scalar_one_or_none()
        if membership and not membership.is_banned:
            is_member = True
            user_role = membership.role

    return EventCommunityResponse(
        id=community.id,
        event_id=community.event_id,
        name=community.name,
        description=community.description,
        cover_url=community.cover_url,
        is_open=community.is_open,
        member_count=community.member_count,
        is_member=is_member,
        user_role=user_role,
        created_at=community.created_at,
    )


async def join(
    db: AsyncSession, community_id: str, user_id: str
) -> CommunityJoinResponse:
    community = (
        await db.execute(select(EventCommunity).where(EventCommunity.id == community_id))
    ).scalar_one_or_none()
    if not community:
        raise NotFoundError("Community not found")
    if not community.is_open:
        raise ForbiddenError("Community is invite-only")

    existing = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == user_id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        if existing.is_banned:
            raise ForbiddenError("You are banned from this community")
        raise ConflictError("Already a member")

    member = CommunityMember(
        community_id=community_id,
        user_id=user_id,
        role=CommunityRole.MEMBER,
    )
    db.add(member)
    await db.execute(
        update(EventCommunity)
        .where(EventCommunity.id == community_id)
        .values(member_count=EventCommunity.member_count + 1)
    )
    await db.flush()

    return CommunityJoinResponse(
        joined=True,
        role=CommunityRole.MEMBER,
        member_count=community.member_count + 1,
    )


async def leave(
    db: AsyncSession, community_id: str, user_id: str
) -> CommunityJoinResponse:
    member = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == user_id,
            )
        )
    ).scalar_one_or_none()

    if not member:
        raise NotFoundError("Not a member")
    if member.role == CommunityRole.ADMIN:
        raise ConflictError("Community admin cannot leave — transfer ownership first")

    await db.delete(member)
    community = (
        await db.execute(select(EventCommunity).where(EventCommunity.id == community_id))
    ).scalar_one()
    new_count = max(0, community.member_count - 1)
    community.member_count = new_count
    await db.flush()

    return CommunityJoinResponse(joined=False, role=CommunityRole.MEMBER, member_count=new_count)


async def update_member_role(
    db: AsyncSession, community_id: str, target_user_id: str,
    new_role: CommunityRole, actor_id: str
) -> None:
    actor_membership = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == actor_id,
            )
        )
    ).scalar_one_or_none()
    if not actor_membership or actor_membership.role != CommunityRole.ADMIN:
        raise ForbiddenError("Only community admins can change roles")

    target = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == target_user_id,
            )
        )
    ).scalar_one_or_none()
    if not target:
        raise NotFoundError("Member not found")

    target.role = new_role
    await db.flush()


async def ban_member(
    db: AsyncSession, community_id: str, target_user_id: str, actor_id: str
) -> None:
    actor = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == actor_id,
            )
        )
    ).scalar_one_or_none()
    if not actor or actor.role not in (CommunityRole.ADMIN, CommunityRole.MODERATOR):
        raise ForbiddenError("Only admins/moderators can ban members")

    target = (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == target_user_id,
            )
        )
    ).scalar_one_or_none()
    if not target:
        raise NotFoundError("Member not found")

    target.is_banned = True
    await db.flush()
