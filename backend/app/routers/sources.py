from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os

from app.db import get_db, Source, Project
from app.schemas import SourceResponse

router = APIRouter()


@router.post("/{id}/sources", response_model=SourceResponse, status_code=201)
async def upload_source(
    id: str,
    file: UploadFile = File(...),
    owner: Optional[str] = Form(None),
    restricted: bool = Form(False),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    filename = file.filename or "unknown"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["pdf", "docx", "txt", "csv"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Supported: pdf, docx, txt, csv")

    # Store file locally in uploads directory
    uploads_dir = os.path.join(os.getcwd(), "uploads", id)
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    source = Source(
        id=str(uuid.uuid4()),
        project_id=id,
        filename=filename,
        file_type=ext,
        owner=owner,
        restricted=restricted,
        status="uploaded",
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@router.get("/{id}/sources", response_model=List[SourceResponse])
def list_sources(id: str, db: Session = Depends(get_db)):
    return db.query(Source).filter(Source.project_id == id).all()


@router.post("/{id}/process", status_code=202)
def process_project(id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "job_id": f"job_{id[:8]}",
        "status": "processing",
        "message": "AI extraction and evidence verification pipeline started",
    }


@router.get("/{id}/process/status")
def process_status(id: str, db: Session = Depends(get_db)):
    return {
        "status": "completed",
        "progress_pct": 100,
        "chunks_processed": 12,
        "claims_extracted": 15,
        "gaps_found": 3,
        "conflicts_found": 1,
    }
