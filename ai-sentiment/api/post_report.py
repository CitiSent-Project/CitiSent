# post_report.py - Add input validation
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ai import analyze_report, reports_db

router = APIRouter()

class ReportRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=2000)  # Add limits

@router.post("/report", status_code=201)
def post_report(body: ReportRequest):
    text = body.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    analysis = analyze_report(text)
    
    report = {
        "id": len(reports_db) + 1,
        "text": text,
        "priority": analysis["name"],
        "confidence": f"{analysis['confidence'] * 100:.2f}%"
    }
    
    reports_db.append(report)
    return report