from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ai import analyze_report, reports_db

router = APIRouter()

class ReportRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=2000)

@router.post("/report", status_code=201)
def post_report(body: ReportRequest):
    text = body.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # The AI now does both tasks and combines the answer
    analysis = analyze_report(text)
    
    report = {
        "id": len(reports_db) + 1,
        "text": text,
        "priority": analysis["final_priority"],          # CRITICAL, HIGH, MEDIUM, LOW
        "event_category": analysis["event_type"],        # What happened
        "citizen_emotion": analysis["emotion_detected"], # How they feel
        "metrics": {
            "urgency_conf": f"{analysis['urgency_confidence'] * 100:.2f}%",
            "emotion_conf": f"{analysis['emotion_confidence'] * 100:.2f}%"
        }
    }
    
    reports_db.append(report)
    return report