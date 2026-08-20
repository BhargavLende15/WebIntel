from uuid import UUID

from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    analysis_id: UUID
    format: str = Field(default="pdf", pattern="^(pdf|html)$")
    include_charts: bool = True
    include_recommendations: bool = True


class ReportResponse(BaseModel):
    analysis_id: UUID
    format: str
    download_url: str | None = None
    message: str
    phase: str = "Phase 7 - Report Generator"
