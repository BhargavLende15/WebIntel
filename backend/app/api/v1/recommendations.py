from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_analysis_or_404, get_db_session
from app.models import Recommendation
from app.recommendation_engine import generate_recommendations as build_recommendations
from app.schemas.recommendation import (
    RecommendationItem,
    RecommendationRequest,
    RecommendationResponse,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse)
async def generate_recommendations(
    payload: RecommendationRequest,
    db: Session = Depends(get_db_session),
) -> RecommendationResponse:
    """Generate and persist deterministic recommendations for a completed analysis."""
    analysis = get_analysis_or_404(payload.analysis_id, db)

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

        # Remove recommendations whose evidence no longer exists.
        for item in existing:
            if item.issue not in current_issues:
                db.delete(item)

        # Update existing issue records or insert new ones.
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

        # Return a stable response using the generated values.
        response_items = [
            RecommendationItem(**data)
            for data in generated
        ]

        return RecommendationResponse(
            analysis_id=analysis.id,
            recommendations=response_items,
            total_count=len(response_items),
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
