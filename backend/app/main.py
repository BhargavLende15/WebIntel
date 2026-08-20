from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.database.base import Base
from app.database.session import engine
from app.schemas.common import HealthResponse
from app.utils.config import configure_logging, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "WebIntel – AI-Powered Digital Readiness Assessment Platform API. "
        "Evaluates websites across performance, SEO, accessibility, security, "
        "AI readiness, content quality, and mobile experience."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="webintel-api")


app.include_router(api_router, prefix="/api/v1")
