from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: UUID | None = None
    analysis_id: UUID | None = None
    website_id: UUID | None = None


class ChatResponse(BaseModel):
    session_id: UUID
    reply: str
    phase: str = "Phase 4 - AI Decision Support Assistant"
