from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_analysis_or_404, get_db_session
from app.schemas.report import ReportRequest, ReportResponse

router = APIRouter(prefix="/report", tags=["Reports"])


@router.post("/pdf", response_model=ReportResponse)
async def generate_report(
    payload: ReportRequest,
    db: Session = Depends(get_db_session),
) -> ReportResponse:
    """Generate a professional PDF or HTML report."""
    analysis = get_analysis_or_404(payload.analysis_id, db)

    return ReportResponse(
        analysis_id=analysis.id,
        format=payload.format,
        download_url=None,
        message=(
            f"Report generation for analysis {analysis.id} will be available in Phase 7. "
            f"Requested format: {payload.format.upper()}."
        ),
    )
