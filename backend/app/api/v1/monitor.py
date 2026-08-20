from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_website_or_404
from app.models import MonitoringJob
from app.schemas.monitor import MonitorRequest, MonitorResponse

router = APIRouter(prefix="/monitor", tags=["Monitoring"])


@router.post("", response_model=MonitorResponse)
async def setup_monitoring(
    payload: MonitorRequest,
    db: Session = Depends(get_db_session),
) -> MonitorResponse:
    """Configure continuous monitoring for a website."""
    website = get_website_or_404(payload.website_id, db)

    job = MonitoringJob(
        id=uuid4(),
        website_id=website.id,
        frequency=payload.frequency,
        is_active=payload.is_active,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return MonitorResponse(
        job_id=job.id,
        website_id=website.id,
        frequency=job.frequency,
        is_active=job.is_active,
        message="Monitoring job created. Full scheduling available in Phase 7.",
    )
