from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PartnerPreference(Base):
    __tablename__ = "partner_preferences"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    study_mode: Mapped[Optional[str]] = mapped_column(String(20))
    availability: Mapped[Optional[str]] = mapped_column(String(50))
    subjects_json: Mapped[str] = mapped_column(Text, default="[]")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="partner_pref")


class PartnerConnection(Base):
    __tablename__ = "partner_connections"

    id: Mapped[int] = mapped_column(primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    icebreaker: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    requester: Mapped["User"] = relationship(foreign_keys=[requester_id])
    receiver: Mapped["User"] = relationship(foreign_keys=[receiver_id])
    messages: Mapped[list["PartnerMessage"]] = relationship(back_populates="connection", cascade="all, delete-orphan")


class PartnerMessage(Base):
    __tablename__ = "partner_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    connection_id: Mapped[int] = mapped_column(ForeignKey("partner_connections.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    connection: Mapped["PartnerConnection"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship()
