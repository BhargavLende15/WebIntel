from uuid import UUID

from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    issue: str
    description: str
    why_it_matters: str | None = None
    business_impact: str | None = None
    priority: str
    estimated_improvement: float | None = None
    difficulty: str | None = None
    suggested_implementation: str | None = None


class RecommendationRequest(BaseModel):
    analysis_id: UUID


class RecommendationResponse(BaseModel):
    analysis_id: UUID
    recommendations: list[RecommendationItem]
    total_count: int
    phase: str = "Phase 4 - AI Recommendation Engine"
