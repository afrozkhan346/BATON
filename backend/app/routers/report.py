from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db, Project, Claim, Gap, Source
from app.schemas import HandoverReportResponse, HandoverItem

router = APIRouter()


@router.get("/projects/{id}/report", response_model=HandoverReportResponse)
def get_handover_report(id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        # Fallback mock report for early frontend rendering
        return HandoverReportResponse(
            project_id=id,
            project_name="Inventory Service",
            status="DRAFT · AWAITING APPROVAL",
            handover_ready=False,
            overview="Tracks stock across warehouses. The core API is live; the sync endpoint is incomplete.",
            what_is_known=[
                HandoverItem(
                    claim_id="c-014-uuid",
                    code="C-014",
                    statement="PostgreSQL selected for relational reporting across tasks and owners",
                    source="architecture_notes_v2.docx",
                    status="VERIFIED",
                ),
                HandoverItem(
                    claim_id="c-035-uuid",
                    code="C-035",
                    statement="Cache layer deferred to v2",
                    source="roadmap.pdf",
                    status="VERIFIED",
                ),
            ],
            what_remains_uncertain=[
                HandoverItem(
                    claim_id="c-021-uuid",
                    code="C-021",
                    statement="Sync endpoint paused before completion",
                    source="sprint_notes.txt",
                    status="NEEDS_REVIEW",
                    reason="Awaiting human verification",
                ),
                HandoverItem(
                    claim_id="c-027-uuid",
                    code="C-027",
                    statement="Deploy script needs a manual env fix",
                    source="chat_export.txt",
                    status="UNSUPPORTED",
                    reason="Evidence quote not found in document",
                ),
            ],
            what_needs_attention=[
                {
                    "kind": "missing_owner",
                    "description": "Sync endpoint has no owner.",
                    "follow_up_question": "Who will take ownership of the sync endpoint?",
                },
                {
                    "kind": "conflicting_records",
                    "description": "Auth module ownership conflict between tasks.csv and chat logs.",
                    "follow_up_question": "Confirm whether A. Sample or B. Sample owns Auth module.",
                },
            ],
            next_actions=[
                "Assign an owner for the sync endpoint",
                "Resolve the rate-limit decision",
                "Review the deploy workaround",
            ],
        )

    claims = db.query(Claim).filter(Claim.project_id == id).all()
    gaps = db.query(Gap).filter(Gap.project_id == id).all()

    what_is_known = []
    what_remains_uncertain = []
    next_actions = []

    for c in claims:
        src = db.query(Source).filter(Source.id == c.source_id).first() if c.source_id else None
        item = HandoverItem(
            claim_id=c.id,
            code=c.code,
            statement=c.statement,
            source=src.filename if src else None,
            status=c.status,
            reason=c.evidence_check.get("note") if c.evidence_check else None,
        )
        if c.status == "VERIFIED":
            what_is_known.append(item)
        else:
            what_remains_uncertain.append(item)

        if c.type == "next_action":
            next_actions.append(c.statement)

    what_needs_attention = [
        {
            "id": g.id,
            "kind": g.kind,
            "description": g.description,
            "follow_up_question": g.follow_up_question,
            "status": g.status,
        }
        for g in gaps
        if g.status == "open"
    ]

    has_pending = any(c.status in ["NEEDS_REVIEW", "CONFLICT"] for c in claims)
    status_label = "APPROVED" if (not has_pending and len(claims) > 0) else "DRAFT · AWAITING APPROVAL"

    return HandoverReportResponse(
        project_id=project.id,
        project_name=project.name,
        status=status_label,
        handover_ready=(status_label == "APPROVED"),
        overview=f"Handover report for {project.name}. Departing: {project.departing_member or 'N/A'}, Successor: {project.successor or 'N/A'}.",
        what_is_known=what_is_known,
        what_remains_uncertain=what_remains_uncertain,
        what_needs_attention=what_needs_attention,
        next_actions=next_actions,
    )


@router.post("/projects/{id}/approve")
def approve_handover(id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    unreviewed = db.query(Claim).filter(Claim.project_id == id, Claim.status == "NEEDS_REVIEW").count()
    if unreviewed > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve project: {unreviewed} claims are still pending review.",
        )

    return {"status": "approved", "project_id": id, "message": "Handover report formally approved."}
