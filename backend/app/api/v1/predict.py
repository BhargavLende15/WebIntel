from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_website_or_404
from app.api.v1.auth import get_current_user
from app.models import User
from app.schemas.predict import PredictRequest, PredictResponse

router = APIRouter(prefix="/predict", tags=["Predictive Analytics"])


@router.post("", response_model=PredictResponse)
async def predict_score(
    payload: PredictRequest,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> PredictResponse:
    """Predict future readiness only for an owned website."""
    website = get_owned_website_or_404(payload.website_id, user, db)

    return PredictResponse(
        website_id=website.id,
        predicted_score=0.0,
        expected_improvement=0.0,
        category_growth={
            "performance": 0.0,
            "seo": 0.0,
            "accessibility": 0.0,
            "security": 0.0,
            "ai_readiness": 0.0,
            "content_quality": 0.0,
            "mobile_experience": 0.0,
        },
        model_type="linear_regression",
        confidence=0.0,
    )
