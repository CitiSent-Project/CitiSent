from fastapi import APIRouter, HTTPException

router = APIRouter()

SUPPORTED_URGENCY_LEVELS = ["Emergency", "Urgent", "Moderate", "Calm"]


@router.get("/status", status_code=200)
def status():
    try:
        from ai import _get_client, MODEL
        _get_client()  # verify client initializes without error

        return {
            "status": "ready",
            "model": MODEL,
            "supportedUrgencyLevels": SUPPORTED_URGENCY_LEVELS,
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail="Sentiment analysis model is unavailable.")