import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.mcq import McqOut, QuizSubmitRequest, QuizSubmitResponse
from app.services import mcq_service, pdf_service

router = APIRouter(prefix="/practice", tags=["practice"])

_quiz_sessions: dict[str, dict] = {}


@router.get("/subjects")
def subjects(db: Session = Depends(get_db)):
    return mcq_service.get_subjects_with_counts(db)


@router.get("/mcqs", response_model=dict)
def question_bank(
    subject: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=5, le=200),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = mcq_service.get_mcqs_paginated(db, subject, page, per_page, search)
    pages = (total + per_page - 1) // per_page
    return {
        "items": [McqOut.model_validate(m) for m in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


@router.get("/quiz/start")
def start_quiz(
    subject: str,
    count: int = Query(10, ge=3, le=50),
    mode: str = Query("random", pattern="^(random|sequential)$"),
    db: Session = Depends(get_db),
):
    mcqs = mcq_service.get_quiz_questions(db, subject, count, mode)
    if not mcqs:
        raise HTTPException(404, f"No MCQs found for subject: {subject}")
    return {
        "subject": subject,
        "questions": [McqOut.model_validate(m) for m in mcqs],
        "total": len(mcqs),
    }


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    subject: str,
    body: QuizSubmitRequest,
    db: Session = Depends(get_db),
):
    from app.models.mcq import Mcq
    mcq_ids = [a.mcq_id for a in body.answers]
    mcqs = db.query(Mcq).filter(Mcq.id.in_(mcq_ids)).all()
    if not mcqs:
        raise HTTPException(400, "No valid MCQ IDs")
    return mcq_service.evaluate_quiz(mcqs, body.answers)


@router.post("/quiz/pdf")
def quiz_pdf(subject: str, body: QuizSubmitRequest, db: Session = Depends(get_db)):
    from app.models.mcq import Mcq
    mcq_ids = [a.mcq_id for a in body.answers]
    mcqs = db.query(Mcq).filter(Mcq.id.in_(mcq_ids)).all()
    result = mcq_service.evaluate_quiz(mcqs, body.answers)
    pdf_bytes = pdf_service.generate_quiz_pdf(subject, result)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="cssbuddy_quiz_{subject}.pdf"'},
    )
