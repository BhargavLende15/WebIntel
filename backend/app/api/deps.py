from collections.abc import Generator
from urllib.parse import urlparse
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import AnalysisResult, Website


def get_db_session() -> Generator[Session, None, None]:
    yield from get_db()


def extract_domain(url: str) -> str:
    parsed = urlparse(str(url))
    return parsed.netloc or parsed.path


def get_analysis_or_404(analysis_id: UUID, db: Session) -> AnalysisResult:
    analysis = db.get(AnalysisResult, analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found",
        )
    return analysis


def get_website_or_404(website_id: UUID, db: Session) -> Website:
    website = db.get(Website, website_id)
    if not website:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Website {website_id} not found",
        )
    return website


def create_placeholder_website(url: str, db: Session, project_id: UUID | None = None) -> Website:
    domain = extract_domain(url)
    website = Website(
        id=uuid4(),
        project_id=project_id,
        url=str(url),
        domain=domain,
        name=domain,
    )
    db.add(website)
    db.flush()
    return website
