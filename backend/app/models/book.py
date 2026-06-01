from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(100))
    condition: Mapped[str] = mapped_column(String(50))
    price: Mapped[int] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(Text)
    contact_details: Mapped[str] = mapped_column(String(500))
    image_paths: Mapped[str] = mapped_column(Text, default="[]")
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship()
