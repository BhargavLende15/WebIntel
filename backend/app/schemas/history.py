from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class HistoryEntry(BaseModel):
    analysis_id: UUID
    overall_score: float | None
    grade: str | None
    created_at: datetime


class HistoryResponse(BaseModel):
    website_id: UUID
    website_url: str
    entries: list[HistoryEntry]
    total_assessments: int
    phase: str = "Phase 7 - Historical Tracking"
