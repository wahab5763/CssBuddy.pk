from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.models.essay import Essay, EssayTopic
from app.models.user import User
from app.schemas.common import Msg
from app.schemas.essay import EssayTopicCreate, EssayTopicOut, GradeEssayRequest
from app.services.file_service import ESSAYS_DIR, save_essay_pdf

router = APIRouter(prefix="/essay", tags=["essay"])


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    rows = db.query(EssayTopic.category).distinct().order_by(EssayTopic.category).all()
    return [r.category for r in rows]


@router.get("/topics")
def topics(category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(EssayTopic).filter(EssayTopic.is_active == True)
    if category:
        q = q.filter(EssayTopic.category == category)
    return [EssayTopicOut.model_validate(t) for t in q.all()]


@router.post("/submit", status_code=201)
async def submit_essay(
    topic_id: int = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf" and not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files accepted")
    topic = db.get(EssayTopic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")

    relpath, size = await save_essay_pdf(file, user.id)
    essay = Essay(
        user_id=user.id,
        topic_id=topic_id,
        pdf_name=file.filename or "essay.pdf",
        pdf_relpath=relpath,
        pdf_size=size,
    )
    db.add(essay)
    db.commit()
    return {"id": essay.id, "detail": "Submitted successfully"}


@router.get("/my-submissions")
def my_submissions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    essays = db.query(Essay).filter(Essay.user_id == user.id).order_by(Essay.submitted_at.desc()).all()
    return [
        {
            "id": e.id,
            "topic": EssayTopicOut.model_validate(e.topic) if e.topic else None,
            "pdf_name": e.pdf_name,
            "status": e.status,
            "score": e.score,
            "feedback": e.feedback,
            "submitted_at": e.submitted_at.isoformat(),
        }
        for e in essays
    ]


@router.get("/submission/{essay_id}/file")
def get_essay_file(essay_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    essay = db.get(Essay, essay_id)
    if not essay:
        raise HTTPException(404, "Essay not found")
    if essay.user_id != user.id and not user.is_admin:
        raise HTTPException(403, "Access denied")
    path = ESSAYS_DIR / essay.pdf_relpath
    if not path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(str(path), media_type="application/pdf", filename=essay.pdf_name)


@router.delete("/submission/{essay_id}", response_model=Msg)
def delete_essay(essay_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    essay = db.get(Essay, essay_id)
    if not essay:
        raise HTTPException(404, "Essay not found")
    if essay.user_id != user.id and not user.is_admin:
        raise HTTPException(403, "Access denied")
    db.delete(essay)
    db.commit()
    return Msg(detail="Deleted")


@router.get("/admin/all")
def admin_all_essays(
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=5, le=100),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(Essay)
    if status:
        q = q.filter(Essay.status == status)
    total = q.count()
    items = q.order_by(Essay.submitted_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": e.id,
                "user": {"id": e.user.id, "name": e.user.name, "email": e.user.email},
                "topic": EssayTopicOut.model_validate(e.topic) if e.topic else None,
                "pdf_name": e.pdf_name,
                "status": e.status,
                "score": e.score,
                "submitted_at": e.submitted_at.isoformat(),
            }
            for e in items
        ],
        "total": total,
    }


@router.patch("/admin/{essay_id}/grade", response_model=Msg)
def grade_essay(
    essay_id: int,
    body: GradeEssayRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone
    essay = db.get(Essay, essay_id)
    if not essay:
        raise HTTPException(404, "Essay not found")
    essay.score = body.score
    essay.feedback = body.feedback
    essay.status = body.status
    essay.admin_notes = body.admin_notes
    essay.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return Msg(detail="Graded")
