from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_analysis_or_404, get_db_session
from app.schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/{analysis_id}", response_model=DashboardResponse)
async def get_dashboard(
    analysis_id: UUID,
    db: Session = Depends(get_db_session),
) -> DashboardResponse:
    """Retrieve dashboard data for an analysis."""
    analysis = get_analysis_or_404(analysis_id, db)

    return DashboardResponse(
        analysis_id=analysis.id,
        overall_score=0.0,
        grade="Pending",
        category_scores={
            "performance": 0.0,
            "seo": 0.0,
            "accessibility": 0.0,
            "security": 0.0,
            "ai_readiness": 0.0,
            "content_quality": 0.0,
            "mobile_experience": 0.0,
        },
        metrics=[],
        charts={
            "radar": [],
            "line": [],
            "bar": [],
            "pie": [],
            "area": [],
        },
    )
