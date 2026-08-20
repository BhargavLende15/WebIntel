from uuid import UUID

from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    analysis_id: UUID


class CategoryScores(BaseModel):
    performance: float = 0.0
    seo: float = 0.0
    accessibility: float = 0.0
    security: float = 0.0
    ai_readiness: float = 0.0
    content_quality: float = 0.0
    mobile_experience: float = 0.0


class ScoreResponse(BaseModel):
    analysis_id: UUID
    overall_score: float = Field(ge=0, le=100)
    grade: str
    confidence: float = Field(ge=0, le=1)
    category_scores: CategoryScores
    explanation: str
    phase: str = "Phase 3 - Scoring Engine"
