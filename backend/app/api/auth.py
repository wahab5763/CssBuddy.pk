from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import OptionalSubject, Profile, User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateMeRequest,
    UpdateOptionalsRequest,
    UpdateProfileRequest,
    UserOut,
)
from app.schemas.common import Msg
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "cssbuddy_refresh"
COOKIE_MAX_AGE = settings.refresh_token_expire_days * 24 * 3600


def _build_user_out(user: User) -> UserOut:
    profile_data = None
    if user.profile:
        from app.schemas.auth import ProfileOut
        profile_data = ProfileOut.model_validate(user.profile)
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        is_admin=user.is_admin,
        created_at=user.created_at,
        profile=profile_data,
        optional_subjects=[o.name for o in user.optional_subjects],
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, data)
    except ValueError as e:
        raise HTTPException(400, str(e))

    access_token = create_access_token(user.id, user.email)
    refresh_token = auth_service.create_session(
        db, user.id, request.headers.get("user-agent", ""), request.client.host if request.client else ""
    )
    response.set_cookie(
        COOKIE_NAME, refresh_token,
        max_age=COOKIE_MAX_AGE, httponly=True, samesite="lax", secure=settings.environment == "production",
    )
    return TokenResponse(access_token=access_token, user=_build_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    access_token = create_access_token(user.id, user.email)
    refresh_token = auth_service.create_session(
        db, user.id, request.headers.get("user-agent", ""), request.client.host if request.client else ""
    )
    response.set_cookie(
        COOKIE_NAME, refresh_token,
        max_age=COOKIE_MAX_AGE, httponly=True, samesite="lax", secure=settings.environment == "production",
    )
    return TokenResponse(access_token=access_token, user=_build_user_out(user))


@router.get("/refresh", response_model=TokenResponse)
def refresh(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")
    user = auth_service.validate_refresh_token(db, token)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")
    access_token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=access_token, user=_build_user_out(user))


@router.delete("/logout", response_model=Msg)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        auth_service.delete_session(db, token)
    response.delete_cookie(COOKIE_NAME)
    return Msg(detail="Logged out")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _build_user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(data: UpdateMeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email.lower()
    if data.mobile and user.profile:
        user.profile.mobile = data.mobile
    db.commit()
    db.refresh(user)
    return _build_user_out(user)


@router.patch("/me/profile", response_model=UserOut)
def update_profile(data: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.profile:
        user.profile = Profile(user_id=user.id)
        db.add(user.profile)
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(user.profile, field, val)
    db.commit()
    db.refresh(user)
    return _build_user_out(user)


@router.patch("/me/optionals", response_model=UserOut)
def update_optionals(data: UpdateOptionalsRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    auth_service.update_optionals(db, user, data.optional_subjects)
    db.refresh(user)
    return _build_user_out(user)


@router.patch("/me/password", response_model=Msg)
def change_password(data: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(400, "Current password incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return Msg(detail="Password updated")
