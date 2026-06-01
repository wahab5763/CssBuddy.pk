from fastapi import APIRouter
from app.services.file_service import list_past_papers

router = APIRouter(prefix="/pastpapers", tags=["pastpapers"])


@router.get("/subjects")
def subjects():
    data = list_past_papers()
    return [
        {
            "subject": subject,
            "year_count": len(years),
            "paper_count": sum(len(papers) for papers in years.values()),
        }
        for subject, years in data.items()
    ]


@router.get("/papers")
def papers(subject: str | None = None):
    data = list_past_papers()
    if subject:
        data = {k: v for k, v in data.items() if k == subject}
    return data
