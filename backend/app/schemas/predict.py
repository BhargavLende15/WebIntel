from uuid import UUID

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    website_id: UUID
    horizon_days: int = Field(default=30, ge=7, le=365)


class PredictResponse(BaseModel):
    website_id: UUID
    predicted_score: float
    expected_improvement: float
    category_growth: dict[str, float]
    model_type: str
    confidence: float
    phase: str = "Phase 6 - Predictive Analytics"
