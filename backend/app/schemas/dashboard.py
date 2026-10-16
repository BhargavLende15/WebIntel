from uuid import UUID

from pydantic import BaseModel


class DashboardMetric(BaseModel):
    label: str
    value: float
    change: float | None = None


class DashboardResponse(BaseModel):
    analysis_id: UUID
    overall_score: float
    grade: str
    confidence: float
    explanation: str | None = None
    category_scores: dict[str, float | None]
    metrics: list[DashboardMetric]
    charts: dict[str, list[dict]]
    phase: str = "Phase 5 - Business Intelligence Dashboard"
