import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.subjects import OPTIONAL_SUBJECTS
from app.models import *  # noqa: F401,F403 — registers all models with SQLAlchemy
from app.models.user import OptionalSubject
from app.api import auth, dashboard, practice, books, pastpapers, news, premium, partner, essay, admin, studyplan, subjects
from app.services.file_service import ensure_dirs

# Suppress uvicorn 401 log noise for expected unauthenticated refresh probes
logging.getLogger("uvicorn.access").addFilter(
    type("_401Filter", (logging.Filter,), {
        "filter": lambda self, r: '"/api/auth/refresh' not in r.getMessage() or "401" not in r.getMessage()
    })()
)


def _seed_optional_subjects() -> None:
    """Ensure all 43 CSS optional subjects exist in the database (idempotent)."""
    db = SessionLocal()
    try:
        existing = {row.name for row in db.query(OptionalSubject.name).all()}
        new_subjects = [
            OptionalSubject(name=name)
            for name in OPTIONAL_SUBJECTS
            if name not in existing
        ]
        if new_subjects:
            db.bulk_save_objects(new_subjects)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_dirs()
    _seed_optional_subjects()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static/pastpapers", StaticFiles(directory="data/past_papers"), name="pastpapers")
app.mount("/static/notes", StaticFiles(directory="data/notes"), name="notes")
app.mount("/static/books", StaticFiles(directory="data/books"), name="books")
app.mount("/static/essays", StaticFiles(directory="essays"), name="essays")

prefix = "/api"
app.include_router(subjects.router, prefix=prefix)
app.include_router(auth.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)
app.include_router(practice.router, prefix=prefix)
app.include_router(books.router, prefix=prefix)
app.include_router(pastpapers.router, prefix=prefix)
app.include_router(news.router, prefix=prefix)
app.include_router(premium.router, prefix=prefix)
app.include_router(partner.router, prefix=prefix)
app.include_router(essay.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)
app.include_router(studyplan.router, prefix=prefix)

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}
