from fastapi import APIRouter, Query
from ai import reports_db
from typing import Optional

router = APIRouter()

@router.get("/report")
def get_report(priority: Optional[str] = Query(default=None, description="Filter by priority: CRITICAL, HIGH, MEDIUM, LOW")):
    valid_priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

    if priority:
        priority = priority.upper()
        if priority not in valid_priorities:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Invalid priority. Choose from: {valid_priorities}")
        filtered = [r for r in reports_db if r["priority"] == priority]
    else:
        filtered = reports_db

    return {
        "total": len(filtered),
        "reports": filtered
    }