from fastapi import APIRouter, Depends, Query
from app.core.deps import get_admin_user
from app.models.user import User
from app.schemas.common import Msg
from app.services import news_service

router = APIRouter(prefix="/news", tags=["news"])

COMPULSORY = ["Current Affairs", "Pakistan Affairs", "Islamic Studies", "English", "General Science & Ability"]


@router.get("/feeds")
def feeds(
    subjects: str | None = Query(None, description="Comma-separated subject list"),
    limit: int = Query(20, ge=5, le=100),
):
    subject_list = [s.strip() for s in subjects.split(",")] if subjects else COMPULSORY
    return news_service.fetch_news(subject_list, limit)


@router.post("/feeds/refresh", response_model=Msg)
def refresh_feeds(_: User = Depends(get_admin_user)):
    news_service.invalidate_cache()
    return Msg(detail="Cache cleared")
