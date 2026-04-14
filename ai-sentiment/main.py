# main.py - Add security features
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from api.post_report import router as post_router
from api.get_report import router as get_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CitiSent LGU Report API",
    description="AI-powered citizen report priority classification",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specify your frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.state.limiter = limiter

app.include_router(post_router)
app.include_router(get_router)