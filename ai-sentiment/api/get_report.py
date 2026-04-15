from fastapi import APIRouter, HTTPException

from ai import get_model_status

router = APIRouter()


@router.get("/status")
def get_status():
    try:
        return get_model_status()
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Sentiment analysis model is unavailable.",
        ) from error
