from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.get_report import router as status_router
from api.post_report import router as analyze_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CitiSent LGU Sentiment API",
    description="AI-powered citizen report urgency classification",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.state.limiter = limiter

app.include_router(analyze_router)
app.include_router(status_router)
