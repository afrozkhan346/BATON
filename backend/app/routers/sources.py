from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os

from app.db import get_db, Source, Project, Chunk, Claim, Gap
from app.schemas import SourceResponse
from app.services.ingest import ingest_document, IngestionError
from app.services.extract import process_and_persist_project_claims
from app.services.evidence import verify_project_claims

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
    content = await file.read()

    try:
        extracted_chunks = ingest_document(filename, content)
    except IngestionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # Store file locally in uploads directory
    uploads_dir = os.path.join(os.getcwd(), "uploads", id)
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, filename)
    with open(file_path, "wb") as f:
        f.write(content)

    source = Source(
        id=str(uuid.uuid4()),
        project_id=id,
        filename=filename,
        file_type=ext,
        owner=owner,
        restricted=restricted,
        status="processed" if extracted_chunks else "uploaded",
    )
    db.add(source)

    # Persist extracted chunks with location metadata
    for c in extracted_chunks:
        chunk_obj = Chunk(
            id=str(uuid.uuid4()),
            source_id=source.id,
            idx=c["idx"],
            text=c["text"],
            location=c["location"],
        )
        db.add(chunk_obj)

    db.commit()
    db.refresh(source)
    return source


@router.get("/{id}/sources", response_model=List[SourceResponse])
def list_sources(id: str, db: Session = Depends(get_db)):
    return db.query(Source).filter(Source.project_id == id).all()


@router.post("/{id}/process", status_code=202)
def process_project(id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. AI Extraction
    created_claims = process_and_persist_project_claims(id, db)

    # 2. Evidence Verification (Layer 1 String Match + Layer 2 Semantic Check)
    verified_claims = verify_project_claims(id, db)

    unsupported_count = sum(1 for c in verified_claims if c.status == "UNSUPPORTED")
    needs_review_count = sum(1 for c in verified_claims if c.status == "NEEDS_REVIEW")

    return {
        "job_id": f"job_{id[:8]}",
        "status": "completed",
        "claims_extracted": len(created_claims),
        "claims_verified_pending_review": needs_review_count,
        "claims_unsupported": unsupported_count,
        "message": f"Extracted {len(created_claims)} claims ({needs_review_count} ready for review, {unsupported_count} unsupported).",
    }


@router.get("/{id}/process/status")
def process_status(id: str, db: Session = Depends(get_db)):
    chunks_count = (
        db.query(Chunk)
        .join(Source, Chunk.source_id == Source.id)
        .filter(Source.project_id == id)
        .count()
    )
    claims_count = db.query(Claim).filter(Claim.project_id == id).count()
    gaps_count = db.query(Gap).filter(Gap.project_id == id).count()

    return {
        "status": "completed" if chunks_count > 0 else "idle",
        "progress_pct": 100 if chunks_count > 0 else 0,
        "chunks_processed": chunks_count,
        "claims_extracted": claims_count,
        "gaps_found": gaps_count,
        "conflicts_found": 0,
    }
