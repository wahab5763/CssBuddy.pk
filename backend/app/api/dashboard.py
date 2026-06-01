import random
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_optional_user
from app.models.mcq import Mcq, McqSet
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

QUOTES = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Believe you can and you're halfway there.",
    "CSS is not a destination, it is a journey of knowledge.",
    "Every expert was once a beginner. Keep going!",
    "Small daily improvements lead to stunning results.",
    "Your preparation today is your success tomorrow.",
    "Discipline is the bridge between goals and accomplishment.",
]


@router.get("/summary")
def summary(user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    today = date.today()
    target_year = None
    exam_year = None
    streak = 0

    if user and user.profile:
        exam_year = user.profile.exam_year or today.year + 1
        streak = user.profile.streak_count

    target_year = exam_year or (today.year + 1 if today.month >= 3 else today.year)
    target_date = date(target_year, 2, 1)
    days_left = max(0, (target_date - today).days)

    return {
        "days_to_exam": days_left,
        "streak": streak,
        "target_year": target_year,
        "quote": random.choice(QUOTES),
    }


@router.get("/flashcards")
def flashcards(count: int = Query(8, ge=2, le=20), db: Session = Depends(get_db)):
    mcqs = db.query(Mcq).join(McqSet).order_by(func.random()).limit(count).all()
    return [
        {
            "id": m.id,
            "question": m.question,
            "correct": m.correct,
            "option_a": m.option_a,
            "option_b": m.option_b,
            "option_c": m.option_c,
            "option_d": m.option_d,
            "subject": m.mcq_set.subject,
        }
        for m in mcqs
    ]


@router.get("/mcqs/latest")
def latest_mcqs(
    subject: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=5, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(Mcq).join(McqSet)
    if subject:
        q = q.filter(McqSet.subject == subject)
    total = q.count()
    items = q.order_by(Mcq.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": m.id,
                "question": m.question,
                "subject": m.mcq_set.subject,
                "correct": m.correct,
            }
            for m in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/motivational-quote")
def motivational_quote():
    return {"quote": random.choice(QUOTES)}
