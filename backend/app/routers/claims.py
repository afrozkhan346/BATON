from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db, Claim, Source
from app.schemas import ClaimResponse

router = APIRouter()


@router.get("/projects/{id}/claims", response_model=List[ClaimResponse])
def list_project_claims(
    id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    type: Optional[str] = Query(None, description="Filter by claim type"),
    db: Session = Depends(get_db),
):
    query = db.query(Claim).filter(Claim.project_id == id)
    if status:
        query = query.filter(Claim.status == status)
    if type:
        query = query.filter(Claim.type == type)

    claims = query.all()

    # If no claims exist yet in DB, return initial mock claims matching proposal visuals for UI readiness
    if not claims and not status and not type:
        return [
            ClaimResponse(
                id="c-014-uuid",
                project_id=id,
                code="C-014",
                type="decision",
                statement="PostgreSQL chosen for relational reporting across tasks and owners",
                source_id="src-1",
                source_name="architecture_notes_v2.docx",
                location="section 3.2",
                confidence="high",
                status="VERIFIED",
                evidence_excerpt="We chose PostgreSQL because the reporting queries need joins across tasks and owners.",
                evidence_check={
                    "exact_match": True,
                    "semantic": "supports",
                    "note": "Excerpt explicitly details why PostgreSQL was selected.",
                },
                conflict_with=[],
                created_at="2026-03-14T10:00:00",
            ),
            ClaimResponse(
                id="c-021-uuid",
                project_id=id,
                code="C-021",
                type="blocker",
                statement="Sync endpoint paused before completion",
                source_id="src-2",
                source_name="sprint_notes.txt",
                location="lines 14-26",
                confidence="medium",
                status="NEEDS_REVIEW",
                evidence_excerpt="Sync work stopped here; waiting on the rate-limit decision.",
                evidence_check={
                    "exact_match": True,
                    "semantic": "supports",
                    "note": "Excerpt explains work stopped waiting on rate-limit decision.",
                },
                conflict_with=[],
                created_at="2026-05-02T11:00:00",
            ),
            ClaimResponse(
                id="c-027-uuid",
                project_id=id,
                code="C-027",
                type="workaround",
                statement="Deploy script needs a manual env fix",
                source_id="src-3",
                source_name="chat_export.txt",
                location="line 88",
                confidence="low",
                status="UNSUPPORTED",
                evidence_excerpt="deploy script fails occasionally on env",
                evidence_check={
                    "exact_match": False,
                    "semantic": "no",
                    "note": "Quotation does not confirm a manual workaround fix.",
                },
                conflict_with=[],
                created_at="2026-06-18T15:30:00",
            ),
            ClaimResponse(
                id="c-031-uuid",
                project_id=id,
                code="C-031",
                type="ownership",
                statement="Auth module owned by A. Sample",
                source_id="src-4",
                source_name="tasks.csv",
                location="row 14",
                confidence="high",
                status="CONFLICT",
                evidence_excerpt="Auth module: Owner A. Sample",
                evidence_check={
                    "exact_match": True,
                    "semantic": "supports",
                    "note": "Tasks CSV explicitly lists A. Sample as owner.",
                },
                conflict_with=["c-032-uuid"],
                created_at="2026-04-09T09:00:00",
            ),
            ClaimResponse(
                id="c-035-uuid",
                project_id=id,
                code="C-035",
                type="decision",
                statement="Cache layer deferred to v2",
                source_id="src-5",
                source_name="roadmap.pdf",
                location="page 2",
                confidence="medium",
                status="VERIFIED",
                evidence_excerpt="Redis caching layer deferred to post-MVP release v2.",
                evidence_check={
                    "exact_match": True,
                    "semantic": "supports",
                    "note": "Confirmed in roadmap text.",
                },
                conflict_with=[],
                created_at="2026-02-27T14:15:00",
            ),
        ]

    result = []
    for c in claims:
        src = db.query(Source).filter(Source.id == c.source_id).first() if c.source_id else None
        result.append(
            ClaimResponse(
                id=c.id,
                project_id=c.project_id,
                code=c.code,
                type=c.type,
                statement=c.statement,
                source_id=c.source_id,
                source_name=src.filename if src else None,
                chunk_id=c.chunk_id,
                evidence_excerpt=c.evidence_excerpt,
                source_date=c.source_date,
                location=c.location,
                confidence=c.confidence,
                status=c.status,
                evidence_check=c.evidence_check,
                conflict_with=c.conflict_with or [],
                created_at=c.created_at,
            )
        )
    return result


@router.get("/claims/{id}", response_model=ClaimResponse)
def get_claim(id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    src = db.query(Source).filter(Source.id == claim.source_id).first() if claim.source_id else None
    return ClaimResponse(
        id=claim.id,
        project_id=claim.project_id,
        code=claim.code,
        type=claim.type,
        statement=claim.statement,
        source_id=claim.source_id,
        source_name=src.filename if src else None,
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
