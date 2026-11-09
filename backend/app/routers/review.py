from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db import get_db, Claim, ReviewEvent
from app.schemas import ClaimResponse, ClaimReviewRequest

router = APIRouter()


@router.post("/claims/{id}/review", response_model=ClaimResponse)
def review_claim(id: str, payload: ClaimReviewRequest, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    before_state = {
        "statement": claim.statement,
        "status": claim.status,
    }

    if payload.action == "verify":
        # Strict Rule: Evidence excerpt must exist and evidence check must not be 'no'
        if not claim.evidence_excerpt or not claim.evidence_excerpt.strip():
            raise HTTPException(
                status_code=400,
                detail="Verification rejected: A claim cannot be marked VERIFIED without supporting evidence.",
            )
        if claim.evidence_check and claim.evidence_check.get("semantic") == "no":
            raise HTTPException(
                status_code=400,
                detail="Verification rejected: Evidence check failed for this claim.",
            )
        claim.status = "VERIFIED"

    elif payload.action == "reject":
        claim.status = "REJECTED"

    elif payload.action == "edit":
        if payload.statement:
            claim.statement = payload.statement
        claim.status = "NEEDS_REVIEW"

    elif payload.action == "add_context":
        # Keeps status, records context in review events
        pass

    else:
        raise HTTPException(status_code=400, detail=f"Unknown review action: {payload.action}")

    after_state = {
        "statement": claim.statement,
        "status": claim.status,
    }

    # Record audit event
    event = ReviewEvent(
        id=str(uuid.uuid4()),
        claim_id=claim.id,
        reviewer=payload.reviewer,
        action=payload.action,
        before=before_state,
        after=after_state,
    )
    db.add(event)
    db.commit()
    db.refresh(claim)

    return ClaimResponse(
        id=claim.id,
        project_id=claim.project_id,
        code=claim.code,
        type=claim.type,
        statement=claim.statement,
        source_id=claim.source_id,
        source_name=None,
        chunk_id=claim.chunk_id,
        evidence_excerpt=claim.evidence_excerpt,
        source_date=claim.source_date,
        location=claim.location,
        confidence=claim.confidence,
        status=claim.status,
        evidence_check=claim.evidence_check,
        conflict_with=claim.conflict_with or [],
        created_at=claim.created_at,
    )
