from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.book import Book
from app.models.essay import Essay, EssayTopic
from app.models.mcq import Mcq, McqSet
from app.models.user import User
from app.schemas.common import Msg
from app.schemas.essay import EssayTopicCreate
from app.services.file_service import NOTES_DIR

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return {
        "users": db.query(User).count(),
        "essays": db.query(Essay).count(),
        "essays_pending": db.query(Essay).filter(Essay.status == "pending").count(),
        "mcqs": db.query(Mcq).count(),
        "books": db.query(Book).count(),
    }


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=5, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    q = db.query(User)
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "is_admin": u.is_admin,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
                "prep_level": u.profile.prep_level if u.profile else None,
                "exam_type": u.profile.exam_type if u.profile else None,
            }
            for u in users
        ],
        "total": total,
    }


@router.patch("/users/{user_id}/toggle", response_model=Msg)
def toggle_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    db.commit()
    return Msg(detail=f"User {'activated' if user.is_active else 'deactivated'}")


@router.delete("/users/{user_id}", response_model=Msg)
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return Msg(detail="User deleted")


@router.post("/mcqs/upload", response_model=Msg)
async def upload_mcqs(
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    import openpyxl, io
    content = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content))
    ws = wb.active
    headers = [str(c.value or "").strip().lower() for c in ws[1]]

    existing = db.query(McqSet).filter(McqSet.subject == subject).first()
    if existing:
        db.delete(existing)
        db.flush()

    mcq_set = McqSet(subject=subject, source_file=file.filename)
    db.add(mcq_set)
    db.flush()

    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        data = dict(zip(headers, row))
        if not data.get("question"):
            continue
        rows.append(
            Mcq(
                set_id=mcq_set.id,
                question=str(data.get("question", "")),
                option_a=str(data.get("option_a", data.get("a", ""))),
                option_b=str(data.get("option_b", data.get("b", ""))),
                option_c=str(data.get("option_c", data.get("c", ""))),
                option_d=str(data.get("option_d", data.get("d", ""))),
                correct=str(data.get("correct", "A")).strip().upper()[0],
            )
        )

    db.bulk_save_objects(rows)
    db.commit()
    return Msg(detail=f"Imported {len(rows)} MCQs for {subject}")


@router.post("/notes/upload", response_model=Msg)
async def upload_note(
    file: UploadFile = File(...),
    _: User = Depends(get_admin_user),
):
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    dest = NOTES_DIR / (file.filename or "note.pdf")
    dest.write_bytes(content)
    return Msg(detail=f"Uploaded {file.filename}")


@router.delete("/notes/{filename}", response_model=Msg)
def delete_note(filename: str, _: User = Depends(get_admin_user)):
    path = NOTES_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    path.unlink()
    return Msg(detail="Deleted")


@router.post("/topics", status_code=201)
def create_topic(data: EssayTopicCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    topic = EssayTopic(category=data.category, title=data.title)
    db.add(topic)
    db.commit()
    return {"id": topic.id, "detail": "Created"}


@router.patch("/topics/{topic_id}", response_model=Msg)
def update_topic(topic_id: int, data: EssayTopicCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    topic = db.get(EssayTopic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    topic.category = data.category
    topic.title = data.title
    db.commit()
    return Msg(detail="Updated")


@router.delete("/topics/{topic_id}", response_model=Msg)
def delete_topic(topic_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    topic = db.get(EssayTopic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    db.delete(topic)
    db.commit()
    return Msg(detail="Deleted")
