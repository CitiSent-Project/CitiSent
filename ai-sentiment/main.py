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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(post_router)
app.include_router(get_router)
app.include_router(suggestions_router)