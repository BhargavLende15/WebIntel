from fastapi import APIRouter

from app.api.v1 import (
    auth,
    analyze,
    chat,
    dashboard,
    history,
    monitor,
    predict,
    recommendations,
    reports,
    score,
    websites,
)

api_router = APIRouter()

api_router.include_router(analyze.router)
api_router.include_router(score.router)
api_router.include_router(recommendations.router)
api_router.include_router(dashboard.router)
api_router.include_router(chat.router)
api_router.include_router(predict.router)
api_router.include_router(monitor.router)
api_router.include_router(history.router)
api_router.include_router(reports.router)
api_router.include_router(websites.router)

api_router.include_router(auth.router)
