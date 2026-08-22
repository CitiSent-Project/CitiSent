import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.post_report import router as post_router
from api.get_report import router as get_router
from api.get_suggestions import router as suggestions_router

app = FastAPI(
    title="CitiSent LGU Report API",
    description="AI-powered citizen report classification using Gemini Flash",
    version="2.0.0",
)

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

app.include_router(post_router)
app.include_router(get_router)
app.include_router(suggestions_router)