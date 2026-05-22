from fastapi import FastAPI
from api.post_report import router as post_router
from api.get_report import router as get_router

app = FastAPI(
    title="CitiSent LGU Report API",
    description="AI-powered citizen report classification using Gemini Flash",
    version="2.0.0",
)

app.include_router(post_router)
app.include_router(get_router)