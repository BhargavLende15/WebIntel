import json
import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai import (
    GeminiNotConfiguredError,
    GeminiProviderError,
    GeminiTimeoutError,
    generate_gemini_reply,
)
from app.api.deps import (
    get_db_session,
    get_owned_analysis_or_404,
    get_owned_website_or_404,
)
from app.api.v1.auth import get_current_user
from app.models import ChatSession, User
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    """Chat with Gemini using only the authenticated user's resources."""
    website_id = payload.website_id
    analysis_id = payload.analysis_id
    analysis = None

    if analysis_id is not None:
        analysis = get_owned_analysis_or_404(analysis_id, user, db)
        if website_id is not None and website_id != analysis.website_id:
            raise HTTPException(status_code=404, detail="Resource not found")
        website_id = analysis.website_id

    if website_id is not None:
        get_owned_website_or_404(website_id, user, db)

    session = None
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
        analysis_id = session.analysis_id
        website_id = session.website_id
        if analysis is None and analysis_id is not None:
            analysis = get_owned_analysis_or_404(analysis_id, user, db)
    else:
        if website_id is None:
            raise HTTPException(
                status_code=422,
                detail="Provide an owned website_id or analysis_id to start a chat.",
            )
        session_id = uuid4()

    context = ""
    if analysis is not None:
        context_data = {
            "analysis_id": str(analysis.id),
            "website_id": str(analysis.website_id),
            "status": analysis.status,
            "raw_metrics": analysis.raw_metrics,
            "performance_data": analysis.performance_data,
            "seo_data": analysis.seo_data,
            "accessibility_data": analysis.accessibility_data,
            "security_data": analysis.security_data,
            "mobile_data": analysis.mobile_data,
            "content_data": analysis.content_data,
            "ai_readiness_data": analysis.ai_readiness_data,
        }
        try:
            context = json.dumps(context_data, default=str)[:12000]
        except (TypeError, ValueError):
            context = (
                f"Analysis ID: {analysis.id}; "
                f"status: {analysis.status}; "
                "Detailed metrics could not be serialized."
            )

    try:
        reply = await generate_gemini_reply(payload.message, context)
    except GeminiNotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI assistant is not configured. Set GEMINI_API_KEY in the backend environment.",
        ) from None
    except GeminiTimeoutError:
        raise HTTPException(
            status_code=504,
            detail="The AI provider timed out. Please try again.",
        ) from None
    except GeminiProviderError:
        raise HTTPException(
            status_code=502,
            detail="The AI provider could not complete this request. Please try again.",
        ) from None

    if session is None:
        db.add(
            ChatSession(
                id=session_id,
                user_id=user.id,
                website_id=website_id,
                analysis_id=analysis_id,
            )
        )
        db.commit()

    return ChatResponse(session_id=session_id, reply=reply)
