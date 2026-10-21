from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import create_placeholder_website, get_owned_analysis_or_404, get_db_session
from app.api.v1.auth import get_current_user
from app.analysis.engine import run_analysis
from app.models import AnalysisResult, Project, User, Website
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, AnalysisResponse

router = APIRouter(tags=["Analysis"])


@router.post("/analyze", response_model=AnalyzeResponse, status_code=202)
async def analyze_website(
    payload: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AnalyzeResponse:
    """Queue a website for digital readiness analysis."""
    project_id = payload.project_id
    if project_id is not None:
        project = db.get(Project, project_id)
        if project is None or project.user_id != user.id:
            raise HTTPException(status_code=404, detail="Project not found")
    else:
        # Create a default project if none provided
        from uuid import uuid4
        from app.models import Project
        project = Project(id=uuid4(), user_id=user.id, name=f"{user.email} project")
        db.add(project)
        db.flush()
        project_id = project.id

    website = create_placeholder_website(
        str(payload.url), db, project_id=project_id
    )
    if payload.website_name:
        website.name = payload.website_name

    analysis = AnalysisResult(
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
) -> AnalysisResponse:
    """Retrieve only the authenticated user's analysis results."""
    analysis = get_owned_analysis_or_404(analysis_id, user, db)
    website = db.get(Website, analysis.website_id)
    response = AnalysisResponse.model_validate(analysis)
    response.website_name = website.name if website else None
    response.website_url = website.url if website else None
    response.website_domain = website.domain if website else None
    return response
