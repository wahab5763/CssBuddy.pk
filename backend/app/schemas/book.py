from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BookCreate(BaseModel):
    title: str
    category: str
    condition: str
    price: int
    description: Optional[str] = None
    contact_details: str


class BookOut(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    condition: str
    price: int
    description: Optional[str]
    contact_details: str
    image_paths: list[str] = []
    is_available: bool
    created_at: datetime
    seller_name: Optional[str] = None

    model_config = {"from_attributes": True}
