from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class AnalyzeRequest(BaseModel):
    url: HttpUrl
    project_id: UUID | None = None
    website_name: str | None = Field(default=None, max_length=255)


class AnalyzeResponse(BaseModel):
    message: str
    analysis_id: UUID
    website_id: UUID
    status: str = "queued"
    phase: str = "Phase 2 - Website Analyzer"


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    website_id: UUID
    status: str
    performance_data: dict | None = None
    seo_data: dict | None = None
    accessibility_data: dict | None = None
    security_data: dict | None = None
    mobile_data: dict | None = None
    content_data: dict | None = None
    ai_readiness_data: dict | None = None
    raw_metrics: dict | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
