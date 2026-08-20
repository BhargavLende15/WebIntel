from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import create_placeholder_website, get_analysis_or_404, get_db_session
from app.models import AnalysisResult
from app.schemas.analysis import AnalysisResponse, AnalyzeRequest, AnalyzeResponse

router = APIRouter(tags=["Analysis"])


@router.post("/analyze", response_model=AnalyzeResponse, status_code=202)
async def analyze_website(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db_session),
) -> AnalyzeResponse:
    """Queue a website for digital readiness analysis."""
    website = create_placeholder_website(
        url=str(payload.url),
        db=db,
        project_id=payload.project_id,
    )
    if payload.website_name:
        website.name = payload.website_name

    analysis = AnalysisResult(
        id=uuid4(),
        website_id=website.id,
        status="queued",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return AnalyzeResponse(
        message="Analysis queued successfully. Full analysis available in Phase 2.",
        analysis_id=analysis.id,
        website_id=website.id,
        status=analysis.status,
    )


@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db_session),
) -> AnalysisResult:
    """Retrieve analysis results by ID."""
    return get_analysis_or_404(analysis_id, db)
