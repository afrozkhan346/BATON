from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db, Project, Claim, Gap
from app.schemas import HandoverReportResponse
from app.services.report import generate_handover_report

router = APIRouter()


@router.get("/projects/{id}/report", response_model=HandoverReportResponse)
def get_handover_report(id: str, db: Session = Depends(get_db)):
    try:
        return generate_handover_report(project_id=id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/projects/{id}/approve")
def approve_handover(id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    claims = db.query(Claim).filter(Claim.project_id == id).all()
    if not claims:
        raise HTTPException(status_code=400, detail="Cannot approve an empty project with no extracted claims.")

    unreviewed = [c.code or c.statement for c in claims if c.status in ["NEEDS_REVIEW", "CONFLICT"]]
    if unreviewed:
        raise HTTPException(
            status_code=400,
            detail=f"Approval blocked: {len(unreviewed)} claim(s) are still pending review or conflicting: {', '.join(unreviewed[:5])}",
        )

    open_gaps = db.query(Gap).filter(Gap.project_id == id, Gap.status == "open").count()
    if open_gaps > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Approval blocked: {open_gaps} unresolved knowledge gap(s) remain open.",
        )

    return {
        "status": "APPROVED",
        "project_id": id,
        "message": "Handover report formally approved and ready for successor onboarding.",
    }
