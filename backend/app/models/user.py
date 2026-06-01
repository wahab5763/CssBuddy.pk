from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.session import UserSession
    from app.models.partner import PartnerPreference

user_optionals = Table(
    "user_optionals",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("subject_id", ForeignKey("optionals.id", ondelete="CASCADE"), primary_key=True),
)


class OptionalSubject(Base):
    __tablename__ = "optionals"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    users: Mapped[List["User"]] = relationship(secondary=user_optionals, back_populates="optional_subjects")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    profile: Mapped[Optional["Profile"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    sessions: Mapped[List["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    optional_subjects: Mapped[List["OptionalSubject"]] = relationship(
        secondary=user_optionals, back_populates="users"
    )
    partner_pref: Mapped[Optional["PartnerPreference"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    exam_type: Mapped[str] = mapped_column(String(10), default="CSS")
    exam_year: Mapped[Optional[int]] = mapped_column(Integer)
    prep_level: Mapped[Optional[str]] = mapped_column(String(20))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    mobile: Mapped[Optional[str]] = mapped_column(String(20))
    gender: Mapped[Optional[str]] = mapped_column(String(10))
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[Optional[datetime]] = mapped_column(DateTime)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="profile")
