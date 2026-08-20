from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_website_or_404
from app.models import AnalysisResult, Score
from app.schemas.history import HistoryEntry, HistoryResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/{website_id}", response_model=HistoryResponse)
async def get_website_history(
    website_id: UUID,
    db: Session = Depends(get_db_session),
) -> HistoryResponse:
    """Retrieve historical assessments for a website."""
    website = get_website_or_404(website_id, db)

    stmt = (
        select(AnalysisResult, Score)
        .outerjoin(Score, Score.analysis_id == AnalysisResult.id)
        .where(AnalysisResult.website_id == website_id)
        .order_by(AnalysisResult.created_at.desc())
    )
    results = db.execute(stmt).all()

    entries = [
        HistoryEntry(
            analysis_id=analysis.id,
            overall_score=score.overall_score if score else None,
            grade=score.grade if score else None,
            created_at=analysis.created_at,
        )
        for analysis, score in results
    ]

    return HistoryResponse(
        website_id=website.id,
        website_url=website.url,
        entries=entries,
        total_assessments=len(entries),
    )
