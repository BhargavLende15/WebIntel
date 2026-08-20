from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_analysis_or_404, get_db_session
from app.schemas.score import CategoryScores, ScoreRequest, ScoreResponse

router = APIRouter(prefix="/score", tags=["Scoring"])


@router.post("", response_model=ScoreResponse)
async def calculate_score(
    payload: ScoreRequest,
    db: Session = Depends(get_db_session),
) -> ScoreResponse:
    """Calculate Digital Readiness Score for an analysis."""
    analysis = get_analysis_or_404(payload.analysis_id, db)

    placeholder_scores = CategoryScores(
        performance=0.0,
        seo=0.0,
        accessibility=0.0,
        security=0.0,
        ai_readiness=0.0,
        content_quality=0.0,
        mobile_experience=0.0,
    )

    return ScoreResponse(
        analysis_id=analysis.id,
        overall_score=0.0,
        grade="Pending",
        confidence=0.0,
        category_scores=placeholder_scores,
        explanation=(
            f"Scoring engine will process analysis {analysis.id} in Phase 3. "
            "Weighted categories: Performance 20%, SEO 20%, Accessibility 15%, "
            "Security 15%, AI Readiness 15%, Content 10%, Mobile 5%."
        ),
    )
