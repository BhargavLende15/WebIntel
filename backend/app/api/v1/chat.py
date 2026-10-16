from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import (
    get_db_session,
    get_owned_analysis_or_404,
    get_owned_website_or_404,
)
from app.api.v1.auth import get_current_user
from app.models import ChatSession, User
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    """Chat using only the authenticated user's resources and sessions."""
    website_id = payload.website_id
    analysis_id = payload.analysis_id

    if analysis_id is not None:
        analysis = get_owned_analysis_or_404(analysis_id, user, db)
        if website_id is not None and website_id != analysis.website_id:
            raise HTTPException(status_code=404, detail="Resource not found")
        website_id = analysis.website_id

    if website_id is not None:
        get_owned_website_or_404(website_id, user, db)

    if payload.session_id is not None:
        session = db.get(ChatSession, payload.session_id)
        if session is None or session.user_id != user.id:
            raise HTTPException(status_code=404, detail="Chat session not found")

        if session.website_id is not None:
            get_owned_website_or_404(session.website_id, user, db)
        if session.analysis_id is not None:
            get_owned_analysis_or_404(session.analysis_id, user, db)

        if website_id is not None and website_id != session.website_id:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if analysis_id is not None and analysis_id != session.analysis_id:
            raise HTTPException(status_code=404, detail="Chat session not found")

        session_id = session.id
    else:
        if website_id is None:
            raise HTTPException(
                status_code=422,
                detail="Provide an owned website_id or analysis_id to start a chat.",
            )
        session_id = uuid4()
        db.add(
            ChatSession(
                id=session_id,
                user_id=user.id,
                website_id=website_id,
                analysis_id=analysis_id,
            )
        )
        db.commit()

    return ChatResponse(
        session_id=session_id,
        reply=(
            "WebIntel AI Assistant will be available in Phase 4 with Gemini integration. "
            f'Your question: "{payload.message}"'
        ),
    )
