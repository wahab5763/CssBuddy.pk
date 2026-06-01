import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.models.book import Book
from app.models.user import User
from app.schemas.book import BookCreate, BookOut
from app.schemas.common import Msg
from app.services import file_service

router = APIRouter(prefix="/books", tags=["books"])


def _book_out(b: Book) -> dict:
    return {
        "id": b.id,
        "user_id": b.user_id,
        "title": b.title,
        "category": b.category,
        "condition": b.condition,
        "price": b.price,
        "description": b.description,
        "contact_details": b.contact_details,
        "image_paths": json.loads(b.image_paths or "[]"),
        "is_available": b.is_available,
        "created_at": b.created_at.isoformat(),
        "seller_name": b.user.name if b.user else None,
    }


@router.get("/")
def list_books(
    category: Optional[str] = None,
    condition: Optional[str] = None,
    available_only: bool = True,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=4, le=48),
    db: Session = Depends(get_db),
):
    q = db.query(Book)
    if available_only:
        q = q.filter(Book.is_available == True)
    if category:
        q = q.filter(Book.category == category)
    if condition:
        q = q.filter(Book.condition == condition)
    total = q.count()
    items = q.order_by(Book.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"items": [_book_out(b) for b in items], "total": total, "page": page, "per_page": per_page}


@router.get("/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    return _book_out(book)


@router.post("/", status_code=201)
async def create_book(
    title: str = Form(...),
    category: str = Form(...),
    condition: str = Form(...),
    price: int = Form(...),
    contact_details: str = Form(...),
    description: Optional[str] = Form(None),
    images: list[UploadFile] = File(default=[]),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = Book(
        user_id=user.id,
        title=title,
        category=category,
        condition=condition,
        price=price,
        description=description,
        contact_details=contact_details,
        image_paths="[]",
    )
    db.add(book)
    db.flush()

    image_paths = []
    for img in images[:2]:
        path = await file_service.save_book_image(img, book.id)
        image_paths.append(path)

    book.image_paths = json.dumps(image_paths)
    db.commit()
    db.refresh(book)
    return _book_out(book)


@router.patch("/{book_id}/status", response_model=Msg)
def toggle_availability(book_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    if book.user_id != user.id and not user.is_admin:
        raise HTTPException(403, "Not your listing")
    book.is_available = not book.is_available
    db.commit()
    return Msg(detail="Status updated")


@router.delete("/{book_id}", response_model=Msg)
def delete_book(book_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    if book.user_id != user.id and not user.is_admin:
        raise HTTPException(403, "Not your listing")
    db.delete(book)
    db.commit()
    return Msg(detail="Deleted")
