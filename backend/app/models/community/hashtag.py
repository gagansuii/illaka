from sqlalchemy import ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Hashtag(Base, TimestampMixin):
    __tablename__ = "hashtags"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    tag: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    post_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    posts: Mapped[list["PostHashtag"]] = relationship(
        "PostHashtag", back_populates="hashtag", lazy="select"
    )


class PostHashtag(Base):
    __tablename__ = "post_hashtags"
    __table_args__ = (
        UniqueConstraint("post_id", "hashtag_id", name="uq_post_hashtag"),
        Index("ix_post_hashtags_hashtag_id", "hashtag_id"),
    )

    post_id: Mapped[str] = mapped_column(
        String, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True
    )
    hashtag_id: Mapped[str] = mapped_column(
        String, ForeignKey("hashtags.id", ondelete="CASCADE"), primary_key=True
    )

    post: Mapped["Post"] = relationship("Post", back_populates="hashtags")  # noqa: F821
    hashtag: Mapped["Hashtag"] = relationship("Hashtag", back_populates="posts")
