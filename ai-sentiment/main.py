import os
import hmac
from fastapi import FastAPI, Depends, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from api.post_report import router as post_router
from api.get_report import router as get_router
from api.get_suggestions import router as suggestions_router

app = FastAPI(
    title="CitiSent LGU Report API",
    description="AI-powered citizen report classification using Gemini Flash",
    version="2.0.0",
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_internal_api_key(api_key: str = Security(api_key_header)):
    """
    Validates the internal shared API key between backend and ai-sentiment.
    If SENTIMENT_API_KEY is configured in the environment, requests must provide
    a matching X-API-Key header.
    """
    expected_key = os.getenv("SENTIMENT_API_KEY")
    if not expected_key:
        return True

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing internal API key",
        )

    if not hmac.compare_digest(api_key.strip(), expected_key.strip()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key",
        )

    return True

allowed_origins_env = os.getenv("ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
    allow_credentials = True
else:
    allowed_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "ai-sentiment"}

app.include_router(post_router, dependencies=[Depends(verify_internal_api_key)])
app.include_router(get_router, dependencies=[Depends(verify_internal_api_key)])
app.include_router(suggestions_router, dependencies=[Depends(verify_internal_api_key)])