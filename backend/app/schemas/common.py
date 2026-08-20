from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MessageResponse(BaseModel):
    message: str
    phase: str = "Phase 1 - Stub implementation"


class ErrorResponse(BaseModel):
    detail: str


class PaginationParams(BaseModel):
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)


class TimestampMixin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime | None = None
    updated_at: datetime | None = None
