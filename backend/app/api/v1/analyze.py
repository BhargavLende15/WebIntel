from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.analysis.engine import run_analysis
from app.api.deps import create_placeholder_website, get_owned_analysis_or_404, get_db_session
from app.api.v1.auth import get_current_user
from app.models import AnalysisResult, Project, User
from app.schemas.analysis import AnalysisResponse, AnalyzeRequest, AnalyzeResponse

router = APIRouter(tags=["Analysis"])


@router.post("/analyze", response_model=AnalyzeResponse, status_code=202)
async def analyze_website(
    payload: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AnalyzeResponse:
    """Queue a website for digital readiness analysis."""
    project = None
    if payload.project_id is not None:
        project = (
            db.query(Project)
            .filter(Project.id == payload.project_id, Project.user_id == user.id)
            .first()
        )
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")

    if project is None:
        from app.api.deps import extract_domain
        project = Project(
            user_id=user.id,
            name=f"{extract_domain(str(payload.url))} project",
        )
        db.add(project)
        db.flush()

    website = create_placeholder_website(
        url=str(payload.url),
        db=db,
        project_id=project.id,
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

    background_tasks.add_task(run_analysis, analysis.id)

    return AnalyzeResponse(
        message="Analysis queued successfully.",
        analysis_id=analysis.id,
        website_id=website.id,
        status=analysis.status,
    )


@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AnalysisResult:
    """Retrieve only the authenticated user's analysis results."""
    return get_owned_analysis_or_404(analysis_id, user, db)
