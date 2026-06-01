from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_refresh_token, hash_password, verify_password
from app.models.session import UserSession
from app.models.user import OptionalSubject, Profile, User
from app.schemas.auth import RegisterRequest


def register_user(db: Session, data: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        is_admin=(data.email == settings.admin_email),
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        exam_type=data.exam_type,
        exam_year=data.exam_year,
        prep_level=data.prep_level,
        city=data.city,
        mobile=data.mobile,
        gender=data.gender,
    )
    db.add(profile)

    _sync_optionals(db, user, data.optional_subjects)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_session(db: Session, user_id: int, user_agent: str = "", ip: str = "") -> str:
    token = create_refresh_token()
    expires = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    session = UserSession(
        token=token,
        user_id=user_id,
        expires_at=expires,
        last_seen=datetime.now(timezone.utc),
        user_agent=user_agent,
        ip_address=ip,
    )
    db.add(session)
    db.commit()
    return token


def validate_refresh_token(db: Session, token: str) -> User | None:
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        return None
    now = datetime.now(timezone.utc)
    exp = session.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        db.delete(session)
        db.commit()
        return None
    session.last_seen = now
    db.commit()
    return session.user


def delete_session(db: Session, token: str) -> None:
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if session:
        db.delete(session)
        db.commit()


def _sync_optionals(db: Session, user: User, subject_names: list[str]) -> None:
    user.optional_subjects.clear()
    for name in subject_names:
        opt = db.query(OptionalSubject).filter(OptionalSubject.name == name).first()
        if not opt:
            opt = OptionalSubject(name=name)
            db.add(opt)
            db.flush()
        user.optional_subjects.append(opt)


def update_optionals(db: Session, user: User, subject_names: list[str]) -> None:
    _sync_optionals(db, user, subject_names)
    db.commit()
