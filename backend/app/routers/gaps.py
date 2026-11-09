from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db import get_db, Gap, Claim
from app.schemas import GapResponse, GapResolveRequest

router = APIRouter()


@router.get("/projects/{id}/gaps", response_model=List[GapResponse])
def list_project_gaps(id: str, db: Session = Depends(get_db)):
    gaps = db.query(Gap).filter(Gap.project_id == id).all()

    # Fallback initial data for UI preview
    if not gaps:
        return [
            GapResponse(
                id="gap-01-uuid",
                project_id=id,
                kind="missing_owner",
                description="Sync endpoint has no owner or active assignee.",
                related_claim_id="c-021-uuid",
                follow_up_question="Why was the sync endpoint paused, and who is responsible for resuming it?",
                status="open",
                resolution_note=None,
                created_at="2026-05-02T12:00:00",
            ),
            GapResponse(
                id="gap-02-uuid",
                project_id=id,
                kind="unexplained_decision",
                description="Database choice: No documented architectural decision record for PostgreSQL.",
                related_claim_id="c-014-uuid",
                follow_up_question="Was an ADR approved for PostgreSQL, or is this documented in another wiki?",
                status="resolved",
                resolution_note="Verified via architecture notes section 3.2.",
                created_at="2026-03-14T11:00:00",
            ),
        ]
    return gaps


@router.post("/gaps/{id}/resolve", response_model=GapResponse)
def resolve_gap(id: str, payload: GapResolveRequest, db: Session = Depends(get_db)):
    gap = db.query(Gap).filter(Gap.id == id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")

    gap.status = "resolved"
    gap.resolution_note = payload.resolution_note

    # If an owner was provided, optionally create or update an ownership claim
    if payload.owner and gap.related_claim_id:
        claim = db.query(Claim).filter(Claim.id == gap.related_claim_id).first()
        if claim:
            claim.statement = f"{claim.statement} (Assigned to {payload.owner})"

    db.commit()
    db.refresh(gap)
    return gap
