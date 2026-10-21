from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_analysis_or_404
from app.api.v1.auth import get_current_user
from app.models import (
    AnalysisResult,
    Project,
    Recommendation,
    Score,
    User,
    Website,
)
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

PRIORITY_LABELS = {
    "critical": "Critical",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
}


def _dashboard_response(
    analysis: AnalysisResult,
    db: Session,
) -> DashboardResponse:
    if analysis.status != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Analysis is not completed; current status is '{analysis.status}'.",
        )

    score = db.query(Score).filter(
        Score.analysis_id == analysis.id
    ).first()

    if score is None:
        raise HTTPException(
            status_code=409,
            detail="No persisted readiness score is available for this analysis.",
        )

    website = db.get(Website, analysis.website_id)

    stored_scores = score.category_scores or {}
    category_scores = {
        name: stored_scores.get(name)
        for name in CATEGORY_LABELS
    }

    metrics = [
        DashboardMetric(
            label="Overall Readiness",
            value=float(score.overall_score),
        )
    ]
    metrics.extend(
        DashboardMetric(
            label=CATEGORY_LABELS[name],
            value=float(value),
        )
        for name, value in category_scores.items()
        if value is not None
    )

    radar = [
        {"category": CATEGORY_LABELS[name], "score": float(value)}
        for name, value in category_scores.items()
        if value is not None
    ]

    recent_rows = (
        db.query(AnalysisResult, Score)
        .join(Score, Score.analysis_id == AnalysisResult.id)
        .filter(
            AnalysisResult.website_id == analysis.website_id,
            AnalysisResult.status == "completed",
        )
        .order_by(
            AnalysisResult.completed_at.desc(),
            AnalysisResult.created_at.desc(),
        )
        .limit(20)
        .all()
    )
    recent_rows.reverse()

    line = [
        {
            "date": (
                item.completed_at or item.created_at
            ).isoformat(),
            "score": float(item_score.overall_score),
            "analysis_id": str(item.id),
        }
        for item, item_score in recent_rows
    ]

    bar = [
        {
            "category": CATEGORY_LABELS[name],
            "score": float(value),
        }
        for name, value in category_scores.items()
        if value is not None
    ]

    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.analysis_id == analysis.id)
        .all()
    )
    counts = {key: 0 for key in PRIORITY_LABELS}
    for recommendation in recommendations:
        priority = recommendation.priority
        if priority in counts:
            counts[priority] += 1

    pie = [
        {"name": PRIORITY_LABELS[key], "value": counts[key]}
        for key in ["critical", "high", "medium", "low"]
    ]

    charts = {
        "radar": radar,
        "line": line,
        "bar": bar,
        "pie": pie,
    }

    return DashboardResponse(
        analysis_id=analysis.id,
        website_id=analysis.website_id,
        website_name=website.name if website else None,
        website_url=website.url if website else None,
        website_domain=website.domain if website else None,
        overall_score=float(score.overall_score),
        grade=score.grade,
        confidence=float(score.confidence),
        explanation=score.explanation,
        category_scores=category_scores,
        metrics=metrics,
        charts=charts,
    )


@router.get("/latest", response_model=DashboardResponse)
async def get_latest_dashboard(
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> DashboardResponse:
    """Return dashboard data for the most recently completed analysis."""
    analysis = (
        db.query(AnalysisResult)
        .join(Website, AnalysisResult.website_id == Website.id)
        .join(Project, Website.project_id == Project.id)
        .filter(
            Project.user_id == user.id,
            AnalysisResult.status == "completed",
        )
        .order_by(
            AnalysisResult.completed_at.desc(),
            AnalysisResult.created_at.desc(),
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="No completed analysis found for this account.",
        )

    return _dashboard_response(analysis, db)


@router.get("/{analysis_id}", response_model=DashboardResponse)
async def get_dashboard(
    analysis_id: UUID,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> DashboardResponse:
    """Retrieve dashboard data for a specific completed analysis."""
    analysis = get_owned_analysis_or_404(analysis_id, user, db)
    return _dashboard_response(analysis, db)
