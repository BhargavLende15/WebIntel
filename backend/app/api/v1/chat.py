from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.models import ChatSession
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db_session),
) -> ChatResponse:
    """Chat with the AI Decision Support Assistant."""
    session_id = payload.session_id or uuid4()

    if not payload.session_id:
        session = ChatSession(
            id=session_id,
            website_id=payload.website_id,
            analysis_id=payload.analysis_id,
        )
        db.add(session)
        db.commit()

    return ChatResponse(
        session_id=session_id,
        reply=(
            "WebIntel AI Assistant will be available in Phase 4 with Gemini integration. "
            f'Your question: "{payload.message}"'
        ),
    )
