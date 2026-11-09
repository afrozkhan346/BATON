from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db import get_db, Project
from app.schemas import ProjectCreate, ProjectResponse, DashboardResponse
from app.services.report import calculate_dashboard_metrics

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
    try:
        return calculate_dashboard_metrics(project_id=id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
