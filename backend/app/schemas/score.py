from uuid import UUID

from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    analysis_id: UUID


class CategoryScores(BaseModel):
    performance: float | None = None
    seo: float | None = None
    accessibility: float | None = None
    security: float | None = None
    ai_readiness: float | None = None
    content_quality: float | None = None
    mobile_experience: float | None = None


class ScoreResponse(BaseModel):
    analysis_id: UUID
    overall_score: float = Field(ge=0, le=100)
    grade: str
    confidence: float = Field(ge=0, le=1)
    category_scores: CategoryScores
    explanation: str
    phase: str = "Phase 3 - Scoring Engine"
