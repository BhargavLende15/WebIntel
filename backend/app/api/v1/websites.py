from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_website_or_404
from app.api.v1.auth import get_current_user
from app.models import User, Website
from pydantic import BaseModel


router = APIRouter(prefix="/websites", tags=["Websites"])


class WebsiteResponse(BaseModel):
    id: UUID
    url: str
    domain: str
    name: str | None = None


@router.get("/{website_id}", response_model=WebsiteResponse)
async def get_website(
    website_id: UUID,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Website:
    website = get_owned_website_or_404(website_id, user, db)
    return website
