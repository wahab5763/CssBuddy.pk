from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PartnerPrefUpsert(BaseModel):
    study_mode: Optional[str] = None
    availability: Optional[str] = None
    subjects: list[str] = []


class PartnerPrefOut(BaseModel):
    user_id: int
    study_mode: Optional[str]
    availability: Optional[str]
    subjects: list[str] = []

    model_config = {"from_attributes": True}


class PartnerUserOut(BaseModel):
    id: int
    name: str
    city: Optional[str] = None
    prep_level: Optional[str] = None
    exam_type: Optional[str] = None
    optional_subjects: list[str] = []


class ConnectionOut(BaseModel):
    id: int
    requester_id: int
    receiver_id: int
    status: str
    icebreaker: Optional[str]
    created_at: datetime
    partner: Optional[PartnerUserOut] = None

    model_config = {"from_attributes": True}


class ConnectRequest(BaseModel):
    icebreaker: Optional[str] = None


class MessageOut(BaseModel):
    id: int
    connection_id: int
    sender_id: int
    content: str
    is_read: bool
    sent_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str
