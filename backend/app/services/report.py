from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.db import Project, Claim, Gap, Source
from app.schemas import HandoverReportResponse, HandoverItem, DashboardResponse


def generate_handover_report(project_id: str, db: Session) -> HandoverReportResponse:
    """Generates the official structured handover report partitioned into:
    - What is Known (strictly VERIFIED claims)
    - What Remains Uncertain (NEEDS_REVIEW, UNSUPPORTED, CONFLICT)
    - What Needs Attention (Open knowledge gaps & conflicting records)
    - Next Recommended Actions (Derived from claims and gaps)
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project '{project_id}' not found")

    claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    gaps = db.query(Gap).filter(Gap.project_id == project_id).all()
    sources = {s.id: s.filename for s in db.query(Source).filter(Source.project_id == project_id).all()}

    what_is_known: List[HandoverItem] = []
    what_remains_uncertain: List[HandoverItem] = []
    next_actions: List[str] = []

    for c in claims:
        src_name = sources.get(c.source_id, "Source Record")
        if c.status == "VERIFIED":
            what_is_known.append(
                HandoverItem(
                    claim_id=c.id,
                    code=c.code,
                    statement=c.statement,
                    source=src_name,
                    status="VERIFIED",
                )
            )
        elif c.status in ["NEEDS_REVIEW", "UNSUPPORTED", "CONFLICT"]:
            reason = "Awaiting human review"
            if c.status == "UNSUPPORTED":
                reason = c.evidence_check.get("note") if c.evidence_check else "Evidence not substantiated in source text"
            elif c.status == "CONFLICT":
                reason = f"Contradicts claim(s): {', '.join(c.conflict_with or [])}"

            what_remains_uncertain.append(
                HandoverItem(
                    claim_id=c.id,
                    code=c.code,
                    statement=c.statement,
                    source=src_name,
                    status=c.status,
                    reason=reason,
                )
            )

        if c.type in ["next_action", "task"] and c.status != "REJECTED":
            if c.statement not in next_actions:
                next_actions.append(c.statement)

    what_needs_attention: List[Dict[str, Any]] = []
    for g in gaps:
        if g.status == "open":
            what_needs_attention.append({
                "id": g.id,
                "kind": g.kind,
                "description": g.description,
                "follow_up_question": g.follow_up_question,
                "status": "open",
            })
            action_item = f"Action: {g.description}"
            if action_item not in next_actions:
                next_actions.append(action_item)

    has_pending = any(c.status in ["NEEDS_REVIEW", "CONFLICT"] for c in claims)
    has_open_gaps = any(g.status == "open" for g in gaps)
    handover_ready = (not has_pending and len(claims) > 0 and not has_open_gaps)

    status_label = "APPROVED" if handover_ready else "DRAFT · AWAITING APPROVAL"

    overview = (
        f"Knowledge handover report for {project.name}. "
        f"Departing member: {project.departing_member or 'Unspecified'}. "
        f"Designated successor: {project.successor or 'Unspecified'}."
    )

    return HandoverReportResponse(
        project_id=project.id,
        project_name=project.name,
        status=status_label,
        handover_ready=handover_ready,
        overview=overview,
        what_is_known=what_is_known,
        what_remains_uncertain=what_remains_uncertain,
        what_needs_attention=what_needs_attention,
        next_actions=next_actions,
    )


def calculate_dashboard_metrics(project_id: str, db: Session) -> DashboardResponse:
    """Calculates real-time project health and handover readiness metrics (Mockup 1)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project '{project_id}' not found")

    claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    gaps = db.query(Gap).filter(Gap.project_id == project_id).all()

    claims_verified = sum(1 for c in claims if c.status == "VERIFIED")
    claims_total = len(claims)
    gaps_resolved = sum(1 for g in gaps if g.status == "resolved")
    gaps_total = len(gaps)
    approvals_pending = sum(1 for c in claims if c.status in ["NEEDS_REVIEW", "CONFLICT"])
    pending_tasks = sum(1 for c in claims if c.type in ["task", "next_action"] and c.status != "REJECTED")

    needs_attention: List[str] = [g.description for g in gaps if g.status == "open"]
    for c in claims:
        if c.status == "CONFLICT":
            needs_attention.append(f"Conflict: {c.statement}")

    # Health logic
    if len(needs_attention) == 0:
        health = "Ready for Handover" if claims_verified > 0 else "Initialized"
    elif len(needs_attention) <= 3:
        health = "Mostly on track"
    else:
        health = "Needs Attention"

    handover_ready = (approvals_pending == 0 and claims_total > 0 and len(needs_attention) == 0)

    return DashboardResponse(
        project_id=project.id,
        project_name=project.name,
        departing_member=project.departing_member,
        successor=project.successor,
        project_health=health,
        claims_verified=claims_verified,
        claims_total=claims_total,
        gaps_resolved=gaps_resolved,
        gaps_total=gaps_total,
        approvals_pending=approvals_pending,
        pending_tasks=pending_tasks,
        needs_attention=needs_attention,
        handover_ready=handover_ready,
    )
