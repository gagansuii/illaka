import enum

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class ReportReason(str, enum.Enum):
    SPAM = "SPAM"
    HARASSMENT = "HARASSMENT"
    HATE_SPEECH = "HATE_SPEECH"
    MISINFORMATION = "MISINFORMATION"
    INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT"
    IMPERSONATION = "IMPERSONATION"
    OTHER = "OTHER"


class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    ACTIONED = "ACTIONED"
    DISMISSED = "DISMISSED"


class Report(Base, TimestampMixin):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_status", "status"),
        Index("ix_reports_reporter_id", "reporter_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    reporter_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # One of these is set depending on what's being reported
    reported_user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reported_post_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True
    )
    reported_comment_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("comments.id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[ReportReason] = mapped_column(Enum(ReportReason), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus), default=ReportStatus.PENDING, nullable=False
    )
    reviewed_by: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    moderator_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    reporter: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[reporter_id]
    )
