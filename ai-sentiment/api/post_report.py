from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from ai import analyze_report
try:
    from google.genai import errors as genai_errors
except ImportError:
    genai_errors = None

router = APIRouter()


class ReportRequest(BaseModel):
    office: str
    location: str
    description: str

    @field_validator("description")
    @classmethod
    def description_min_length(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Description must be at least 10 characters.")
        return v


@router.post("/analyze", status_code=200)
def analyze(body: ReportRequest):
    if not body.office.strip():
        raise HTTPException(status_code=400, detail="Office cannot be empty.")
    if not body.location.strip():
        raise HTTPException(status_code=400, detail="Location cannot be empty.")

    try:
        result = analyze_report(
            office=body.office.strip(),
            location=body.location.strip(),
            description=body.description.strip(),
        )
        return result
    except Exception as exc:
        err_str = str(exc)
        # Handle Gemini API-specific errors
        if genai_errors and isinstance(exc, genai_errors.ClientError):
            status_code = getattr(exc, "code", None) or exc.status_code if hasattr(exc, "status_code") else 502
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API quota exceeded. Please try again later.",
                )
            if "UNAUTHENTICATED" in err_str or "401" in err_str or "API key" in err_str:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or missing Gemini API key.",
                )
            raise HTTPException(
                status_code=502,
                detail=f"Gemini API error: {err_str}",
            )
        if isinstance(exc, ValueError):
            raise HTTPException(status_code=422, detail=str(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {err_str}",
        )