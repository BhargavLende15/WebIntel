from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_analysis_or_404, get_db_session
from app.models import AnalysisResult, Score
from app.schemas.dashboard import DashboardMetric, DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

CATEGORY_LABELS = {
    "performance": "Performance",
    "seo": "SEO",
    "accessibility": "Accessibility",
    "security": "Security",
    "ai_readiness": "AI Readiness",
    "content_quality": "Content Quality",
    "mobile_experience": "Mobile Experience",
}


def _dashboard_response(analysis: AnalysisResult, db: Session) -> DashboardResponse:
    if analysis.status != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Analysis is not completed; current status is '{analysis.status}'.",
        )

    score = db.query(Score).filter(Score.analysis_id == analysis.id).first()
    if score is None:
        raise HTTPException(
            status_code=409,
            detail="No persisted readiness score is available for this analysis.",
        )

    stored_scores = score.category_scores or {}
    category_scores = {
        name: stored_scores.get(name)
        for name in CATEGORY_LABELS
    }

    metrics = [
        DashboardMetric(label="Overall Readiness", value=float(score.overall_score))
    ]
    metrics.extend(
        DashboardMetric(label=CATEGORY_LABELS[name], value=float(value))
        for name, value in category_scores.items()
        if value is not None
    )

    radar = [
        {"category": CATEGORY_LABELS[name], "score": float(value)}
        for name, value in category_scores.items()
        if value is not None
    ]

    return DashboardResponse(
        analysis_id=analysis.id,
        overall_score=score.overall_score,
        grade=score.grade,
        confidence=score.confidence,
        explanation=score.explanation,
        category_scores=category_scores,
        metrics=metrics,
        charts={
            "radar": radar,
            "line": [],
            "bar": [],
            "pie": [],
            "area": [],
        },
    )


@router.get("/latest", response_model=DashboardResponse)
def get_latest_dashboard(
    db: Session = Depends(get_db_session),
) -> DashboardResponse:
    """Return dashboard data for the most recently completed analysis."""
    analysis = (
        db.query(AnalysisResult)
        .join(Score, Score.analysis_id == AnalysisResult.id)
        .filter(AnalysisResult.status == "completed")
        .order_by(AnalysisResult.completed_at.desc(), AnalysisResult.created_at.desc())
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="No completed website analysis with a persisted score is available yet.",
        )

    return _dashboard_response(analysis, db)


@router.get("/{analysis_id}", response_model=DashboardResponse)
def get_dashboard(
    analysis_id: UUID,
    db: Session = Depends(get_db_session),
) -> DashboardResponse:
    """Retrieve dashboard data for a specific completed analysis."""
    analysis = get_analysis_or_404(analysis_id, db)
    return _dashboard_response(analysis, db)
