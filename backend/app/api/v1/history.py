from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_website_or_404
from app.api.v1.auth import get_current_user
from app.models import AnalysisResult, Score, User
from app.schemas.history import HistoryEntry, HistoryResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/{website_id}", response_model=HistoryResponse)
async def get_website_history(
    website_id: UUID,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> HistoryResponse:
    """Retrieve historical assessments for an owned website."""
    website = get_owned_website_or_404(website_id, user, db)

    stmt = (
        select(AnalysisResult, Score)
        .outerjoin(Score, Score.analysis_id == AnalysisResult.id)
        .where(AnalysisResult.website_id == website.id)
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
