import io
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.deps import get_admin_user, get_current_user
from app.models.user import User
from app.services.file_service import list_notes, NOTES_DIR

router = APIRouter(prefix="/premium", tags=["premium"])


@router.get("/notes")
def notes():
    return list_notes()


@router.get("/notes/{filename}/preview")
def preview_note(filename: str):
    path = NOTES_DIR / filename
    if not path.exists() or path.suffix != ".pdf":
        raise HTTPException(404, "Note not found")
    try:
        from pypdf import PdfReader, PdfWriter
        reader = PdfReader(str(path))
        writer = PdfWriter()
        for i in range(min(3, len(reader.pages))):
            writer.add_page(reader.pages[i])
        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf")
    except Exception:
        raise HTTPException(500, "Could not generate preview")


@router.get("/notes/{filename}/full")
def full_note(filename: str, user: User = Depends(get_current_user)):
    path = NOTES_DIR / filename
    if not path.exists() or path.suffix != ".pdf":
        raise HTTPException(404, "Note not found")
    if not user.is_admin:
        raise HTTPException(403, "Premium access required")
    return StreamingResponse(
        open(path, "rb"),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
