from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EssayTopicOut(BaseModel):
    id: int
    category: str
    title: str
    is_active: bool

    model_config = {"from_attributes": True}


class EssayTopicCreate(BaseModel):
    category: str
    title: str


class EssayOut(BaseModel):
    id: int
    user_id: int
    topic_id: int
    pdf_name: str
    pdf_size: Optional[int]
    status: str
    score: Optional[int]
    feedback: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    topic: Optional[EssayTopicOut] = None

    model_config = {"from_attributes": True}


class GradeEssayRequest(BaseModel):
    score: Optional[int] = None
    feedback: Optional[str] = None
    status: str = "reviewed"
    admin_notes: Optional[str] = None
