from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class McqSet(Base):
    __tablename__ = "mcq_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str] = mapped_column(String(100), index=True)
    source_file: Mapped[Optional[str]] = mapped_column(String(255))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    mcqs: Mapped[List["Mcq"]] = relationship(back_populates="mcq_set", cascade="all, delete-orphan")


class Mcq(Base):
    __tablename__ = "mcqs"

    id: Mapped[int] = mapped_column(primary_key=True)
    set_id: Mapped[int] = mapped_column(ForeignKey("mcq_sets.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[Optional[str]] = mapped_column(Text)
    option_b: Mapped[Optional[str]] = mapped_column(Text)
    option_c: Mapped[Optional[str]] = mapped_column(Text)
    option_d: Mapped[Optional[str]] = mapped_column(Text)
    correct: Mapped[str] = mapped_column(String(1))

    mcq_set: Mapped["McqSet"] = relationship(back_populates="mcqs")
