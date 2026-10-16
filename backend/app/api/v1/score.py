from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_analysis_or_404
from app.api.v1.auth import get_current_user
from app.models import Score, User
from app.schemas.score import CategoryScores, ScoreRequest, ScoreResponse
from app.scoring.engine import calculate_score as calculate_readiness_score

router = APIRouter(prefix="/score", tags=["Scoring"])


@router.post("", response_model=ScoreResponse)
def calculate_score(
    payload: ScoreRequest,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> ScoreResponse:
    """Calculate and persist a readiness score for an owned completed analysis."""
    analysis = get_owned_analysis_or_404(payload.analysis_id, user, db)

    if analysis.status != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Analysis is not completed; current status is '{analysis.status}'.",
        )

    try:
        result = calculate_readiness_score(analysis)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    score = db.query(Score).filter(Score.analysis_id == analysis.id).first()
    if score is None:
        score = Score(analysis_id=analysis.id)
        db.add(score)

    score.overall_score = result.overall_score
    score.grade = result.grade
    score.confidence = result.confidence
    score.category_scores = result.category_scores
    score.explanation = result.explanation

    try:
        db.commit()
        db.refresh(score)
    except Exception:
        db.rollback()
        raise

    categories = {
        name: result.category_scores.get(name)
        for name in CategoryScores.model_fields
    }

    return ScoreResponse(
        analysis_id=analysis.id,
        overall_score=result.overall_score,
        grade=result.grade,
        confidence=result.confidence,
        category_scores=CategoryScores(**categories),
        explanation=result.explanation,
    )
