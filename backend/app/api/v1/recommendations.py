from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_analysis_or_404
from app.api.v1.auth import get_current_user
from app.models import Recommendation, User
from app.recommendation_engine import generate_recommendations as build_recommendations
from app.schemas.recommendation import (
    RecommendationItem,
    RecommendationRequest,
    RecommendationResponse,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])




@router.get("/{analysis_id}", response_model=RecommendationResponse)
async def get_saved_recommendations(
    analysis_id: UUID,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> RecommendationResponse:
    """Return saved recommendations for an owned analysis without modifying data."""
    analysis = get_owned_analysis_or_404(analysis_id, user, db)

    saved = (
        db.query(Recommendation)
        .filter(Recommendation.analysis_id == analysis.id)
        .order_by(Recommendation.created_at.asc(), Recommendation.issue.asc())
        .all()
    )

    items = [
        RecommendationItem(
            issue=item.issue,
            description=item.description,
            why_it_matters=item.why_it_matters,
            business_impact=item.business_impact,
            priority=item.priority,
            estimated_improvement=item.estimated_improvement,
            difficulty=item.difficulty,
            suggested_implementation=item.suggested_implementation,
        )
        for item in saved
    ]

    return RecommendationResponse(
        analysis_id=analysis.id,
        recommendations=items,
        total_count=len(items),
    )

@router.post("", response_model=RecommendationResponse)
async def generate_recommendations(
    payload: RecommendationRequest,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> RecommendationResponse:
    """Generate and persist deterministic recommendations for an owned analysis."""
    analysis = get_owned_analysis_or_404(payload.analysis_id, user, db)

    if analysis.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recommendations can only be generated for completed analyses.",
        )

    try:
        generated = build_recommendations(analysis)
        existing = (
            db.query(Recommendation)
            .filter(Recommendation.analysis_id == analysis.id)
            .all()
        )
        existing_by_issue = {item.issue: item for item in existing}
        current_issues = {item["issue"] for item in generated}

        for item in existing:
            if item.issue not in current_issues:
                db.delete(item)

        for data in generated:
            item = existing_by_issue.get(data["issue"])
            if item is None:
                item = Recommendation(
                    analysis_id=analysis.id,
                    issue=data["issue"],
                    description=data["description"],
                    priority=data["priority"],
                )
                db.add(item)

            for field, value in data.items():
                setattr(item, field, value)

        db.commit()

        return RecommendationResponse(
            analysis_id=analysis.id,
            recommendations=[RecommendationItem(**item) for item in generated],
            total_count=len(generated),
        )
    except HTTPException:
        db.rollback()
        raise
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception:
        db.rollback()
        raise
