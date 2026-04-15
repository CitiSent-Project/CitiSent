from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai import analyze_report

router = APIRouter()


class AnalyzeReportRequest(BaseModel):
    issueType: str = Field(..., min_length=1, max_length=120)
    location: str = Field(..., min_length=1, max_length=240)
    description: str = Field(..., min_length=10, max_length=3000)


def _sanitize_request(body: AnalyzeReportRequest) -> tuple[str, str, str]:
    issue_type = body.issueType.strip()
    location = body.location.strip()
    description = body.description.strip()

    if not issue_type:
        raise HTTPException(status_code=400, detail="Issue type cannot be empty.")

    if not location:
        raise HTTPException(status_code=400, detail="Location cannot be empty.")

    if not description:
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    return issue_type, location, description


@router.post("/analyze")
def analyze_report_endpoint(body: AnalyzeReportRequest):
    issue_type, location, description = _sanitize_request(body)

    try:
        analysis = analyze_report(
            issue_type=issue_type,
            location=location,
            description=description,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Sentiment analysis model is unavailable.",
        ) from error

    return {
        "urgency": analysis["urgency"],
        "confidence": analysis["confidence"],
    }
