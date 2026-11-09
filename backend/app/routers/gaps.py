from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db import get_db, Gap, Claim, ReviewEvent
from app.schemas import GapResponse, GapResolveRequest

router = APIRouter()


@router.get("/projects/{id}/gaps", response_model=List[GapResponse])
def list_project_gaps(id: str, db: Session = Depends(get_db)):
    gaps = db.query(Gap).filter(Gap.project_id == id).all()
    return gaps


@router.post("/gaps/{id}/resolve", response_model=GapResponse)
def resolve_gap(id: str, payload: GapResolveRequest, db: Session = Depends(get_db)):
    gap = db.query(Gap).filter(Gap.id == id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")

    gap.status = "resolved"
    gap.resolution_note = f"[{payload.reviewer}] {payload.resolution_note}"

    # If an owner or note was provided and gap is linked to a claim, update the claim and log review event
    if gap.related_claim_id:
        claim = db.query(Claim).filter(Claim.id == gap.related_claim_id).first()
        if claim:
            before_state = {"statement": claim.statement, "status": claim.status}
            if payload.owner:
                claim.statement = f"{claim.statement} (Assigned owner: {payload.owner})"

            after_state = {"statement": claim.statement, "status": claim.status, "resolution": payload.resolution_note}

            event = ReviewEvent(
                id=str(uuid.uuid4()),
                claim_id=claim.id,
                reviewer=payload.reviewer,
                action="resolve_gap",
                before=before_state,
                after=after_state,
            )
            db.add(event)

    db.commit()
    db.refresh(gap)
    return gap
