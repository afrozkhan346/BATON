from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.db import get_db, Project, Claim, Gap
from app.schemas import ProjectCreate, ProjectResponse, DashboardResponse

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        id=str(uuid.uuid4()),
        name=payload.name,
        departing_member=payload.departing_member,
        successor=payload.successor,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{id}/dashboard", response_model=DashboardResponse)
def get_project_dashboard(id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        # Fallback mock for early testing
        return DashboardResponse(
            project_id=id,
            project_name="Inventory Service",
            departing_member="A. Sample",
            successor="B. Sample",
            project_health="Mostly on track",
            claims_verified=18,
            claims_total=27,
            gaps_resolved=2,
            gaps_total=4,
            approvals_pending=3,
            pending_tasks=14,
            needs_attention=[
                "Sync endpoint has no owner",
                "Database choice: no documented reason",
                "API docs conflict with the code",
            ],
            handover_ready=False,
        )

    claims = db.query(Claim).filter(Claim.project_id == id).all()
    gaps = db.query(Gap).filter(Gap.project_id == id).all()

    claims_verified = sum(1 for c in claims if c.status == "VERIFIED")
    gaps_resolved = sum(1 for g in gaps if g.status == "resolved")
    approvals_pending = sum(1 for c in claims if c.status == "NEEDS_REVIEW")
    pending_tasks = sum(1 for c in claims if c.type in ["task", "next_action"] and c.status != "REJECTED")

    needs_attention = [g.description for g in gaps if g.status == "open"]
    for c in claims:
        if c.status == "CONFLICT":
            needs_attention.append(f"Conflict: {c.statement}")

    return DashboardResponse(
        project_id=project.id,
        project_name=project.name,
        departing_member=project.departing_member,
        successor=project.successor,
        project_health="Mostly on track" if len(needs_attention) <= 3 else "Needs attention",
        claims_verified=claims_verified,
        claims_total=len(claims),
        gaps_resolved=gaps_resolved,
        gaps_total=len(gaps),
        approvals_pending=approvals_pending,
        pending_tasks=pending_tasks,
        needs_attention=needs_attention,
        handover_ready=(approvals_pending == 0 and len(claims) > 0 and len(needs_attention) == 0),
    )
