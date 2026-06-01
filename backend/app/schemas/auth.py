from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    exam_type: str = "CSS"
    exam_year: Optional[int] = None
    prep_level: Optional[str] = None
    city: Optional[str] = None
    mobile: Optional[str] = None
    gender: Optional[str] = None
    optional_subjects: list[str] = []

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower()

    @field_validator("optional_subjects")
    @classmethod
    def max_six(cls, v: list) -> list:
        if len(v) > 6:
            raise ValueError("Maximum 6 optional subjects allowed")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower()


class ProfileOut(BaseModel):
    exam_type: str
    exam_year: Optional[int]
    prep_level: Optional[str]
    city: Optional[str]
    mobile: Optional[str]
    gender: Optional[str]
    streak_count: int

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    created_at: datetime
    profile: Optional[ProfileOut] = None
    optional_subjects: list[str] = []

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    exam_type: Optional[str] = None
    exam_year: Optional[int] = None
    prep_level: Optional[str] = None
    city: Optional[str] = None
    gender: Optional[str] = None


class UpdateOptionalsRequest(BaseModel):
    optional_subjects: list[str]

    @field_validator("optional_subjects")
    @classmethod
    def max_six(cls, v: list) -> list:
        if len(v) > 6:
            raise ValueError("Maximum 6 optional subjects allowed")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
