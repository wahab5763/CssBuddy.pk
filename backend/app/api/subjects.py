from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.subjects import COMPULSORY_SUBJECTS, OPTIONAL_SUBJECTS
from app.models.user import OptionalSubject, user_optionals

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("/")
def all_subjects():
    """Return compulsory and optional subject lists for the CSS/PMS exam."""
    return {
        "compulsory": COMPULSORY_SUBJECTS,
        "optional": OPTIONAL_SUBJECTS,
    }


@router.get("/stats")
def subject_stats(db: Session = Depends(get_db)):
    """Return each optional subject with how many users have chosen it."""
    rows = (
        db.query(OptionalSubject.name, func.count(user_optionals.c.user_id).label("count"))
        .outerjoin(user_optionals, user_optionals.c.subject_id == OptionalSubject.id)
        .group_by(OptionalSubject.name)
        .order_by(func.count(user_optionals.c.user_id).desc())
        .all()
    )
    return [{"subject": r.name, "user_count": r.count} for r in rows]
