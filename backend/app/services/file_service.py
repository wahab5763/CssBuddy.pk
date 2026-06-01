import json
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings

DATA_DIR = Path("data")
BOOKS_DIR = DATA_DIR / "books"
ESSAYS_DIR = Path("essays")
NOTES_DIR = DATA_DIR / "notes"
PAST_PAPERS_DIR = DATA_DIR / "past_papers"


def ensure_dirs() -> None:
    for d in [BOOKS_DIR, ESSAYS_DIR, NOTES_DIR, PAST_PAPERS_DIR]:
        d.mkdir(parents=True, exist_ok=True)


async def save_book_image(file: UploadFile, book_id: int) -> str:
    max_bytes = settings.max_image_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(400, f"Image too large (max {settings.max_image_mb}MB)")

    book_dir = BOOKS_DIR / str(book_id)
    book_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "img.jpg").suffix.lower() or ".jpg"
    fname = f"{uuid.uuid4().hex}{suffix}"
    dest = book_dir / fname

    img = Image.open(io.BytesIO(content))
    img.thumbnail((1200, 1200))
    img.save(dest, optimize=True, quality=85)

    return f"books/{book_id}/{fname}"


import io


async def save_essay_pdf(file: UploadFile, user_id: int) -> tuple[str, int]:
    max_bytes = settings.max_pdf_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(400, f"PDF too large (max {settings.max_pdf_mb}MB)")

    essay_dir = ESSAYS_DIR / f"user_{user_id}"
    essay_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}.pdf"
    dest = essay_dir / safe_name
    dest.write_bytes(content)

    return f"user_{user_id}/{safe_name}", len(content)


def list_past_papers() -> dict[str, dict[str, list[str]]]:
    result: dict[str, dict[str, list[str]]] = {}
    if not PAST_PAPERS_DIR.exists():
        return result
    for subject_dir in sorted(PAST_PAPERS_DIR.iterdir()):
        if not subject_dir.is_dir():
            continue
        subject = subject_dir.name.replace("_", " ")
        result[subject] = {}
        for year_dir in sorted(subject_dir.iterdir()):
            if year_dir.is_dir():
                files = [f.name for f in sorted(year_dir.glob("*.pdf"))]
                if files:
                    result[subject][year_dir.name] = files
            elif year_dir.suffix == ".pdf":
                year = "General"
                result[subject].setdefault(year, []).append(year_dir.name)
    return result


def list_notes() -> list[dict]:
    if not NOTES_DIR.exists():
        return []
    return [
        {"filename": f.name, "display_name": f.stem.replace("_", " ").title(), "size": f.stat().st_size}
        for f in sorted(NOTES_DIR.glob("*.pdf"))
    ]
