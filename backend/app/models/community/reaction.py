import enum

from sqlalchemy import Enum, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class ReactionType(str, enum.Enum):
    LIKE = "LIKE"
    LOVE = "LOVE"
    FIRE = "FIRE"
    CLAP = "CLAP"
    SAD = "SAD"


class Reaction(Base, TimestampMixin):
    """
    Emoji reactions on posts or comments.
    One reaction type per user per target — changing type replaces existing.
    """
    __tablename__ = "reactions"
    __table_args__ = (
        # A user can only have one reaction per post
        UniqueConstraint("user_id", "post_id", name="uq_reaction_user_post"),
        Index("ix_reactions_post_id", "post_id"),
        Index("ix_reactions_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    post_id: Mapped[str] = mapped_column(
        String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    reaction_type: Mapped[ReactionType] = mapped_column(
        Enum(ReactionType), default=ReactionType.LIKE, nullable=False
    )

    post: Mapped["Post"] = relationship("Post", back_populates="reactions")  # noqa: F821
    user: Mapped["User"] = relationship("User")  # noqa: F821
