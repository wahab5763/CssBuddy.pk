from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class EssayTopic(Base):
    __tablename__ = "essay_topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    essays: Mapped[list["Essay"]] = relationship(back_populates="topic")


class Essay(Base):
    __tablename__ = "essays"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("essay_topics.id"))
    pdf_name: Mapped[str] = mapped_column(String(255))
    pdf_relpath: Mapped[str] = mapped_column(String(500))
    pdf_size: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    score: Mapped[Optional[int]] = mapped_column(Integer)
    feedback: Mapped[Optional[str]] = mapped_column(Text)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    user: Mapped["User"] = relationship()
    topic: Mapped["EssayTopic"] = relationship(back_populates="essays")
