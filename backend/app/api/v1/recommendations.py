from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_analysis_or_404, get_db_session
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse)
async def generate_recommendations(
    payload: RecommendationRequest,
    db: Session = Depends(get_db_session),
) -> RecommendationResponse:
    """Generate AI-powered optimization recommendations."""
    analysis = get_analysis_or_404(payload.analysis_id, db)

    return RecommendationResponse(
        analysis_id=analysis.id,
        recommendations=[],
        total_count=0,
    )
