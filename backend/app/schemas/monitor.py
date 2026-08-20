from uuid import UUID

from pydantic import BaseModel, Field


class MonitorRequest(BaseModel):
    website_id: UUID
    frequency: str = Field(default="weekly", pattern="^(daily|weekly|monthly)$")
    is_active: bool = True


class MonitorResponse(BaseModel):
    job_id: UUID
    website_id: UUID
    frequency: str
    is_active: bool
    message: str
    phase: str = "Phase 7 - Continuous Monitoring"
