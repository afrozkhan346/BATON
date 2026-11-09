import pytest
import uuid
from app.db import SessionLocal, Project, Source, Chunk, Claim
from app.schemas import ExtractedClaim
from app.services.extract import (
    extract_claims_from_chunk,
    deduplicate_claims,
    process_and_persist_project_claims,
)


def test_deduplicate_claims():
    claims = [
        ExtractedClaim(
            type="decision",
            statement="PostgreSQL chosen for relational queries",
            evidence_excerpt="We chose PostgreSQL",
            confidence="high",
        ),
        ExtractedClaim(
            type="decision",
            statement="  postgresql chosen for relational queries  ",  # duplicate with extra spaces/case
            evidence_excerpt="We chose PostgreSQL",
            confidence="high",
        ),
        ExtractedClaim(
            type="blocker",
            statement="Sync endpoint paused",
            evidence_excerpt="Sync work stopped",
            confidence="medium",
        ),
    ]

    unique = deduplicate_claims(claims)
    assert len(unique) == 2
    types = [c.type for c in unique]
    assert "decision" in types
    assert "blocker" in types


def test_extract_claims_from_chunk():
    chunk_text = "We chose PostgreSQL because the reporting queries need joins across tasks and owners."
    claims = extract_claims_from_chunk(
        chunk_text=chunk_text,
        source_name="architecture_notes.docx",
        location="section 3.2",
    )
    assert len(claims) >= 1
    assert any("PostgreSQL" in c.statement for c in claims)
    assert all(c.evidence_excerpt != "" for c in claims)


def test_process_and_persist_project_claims_pipeline():
    db = SessionLocal()
    try:
        # Create Project
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Extraction Test Project")
        db.add(project)

        # Create Source
        src_id = str(uuid.uuid4())
        source = Source(
            id=src_id,
            project_id=proj_id,
            filename="architecture_notes_v2.docx",
            file_type="docx",
            restricted=False,
        )
        db.add(source)

        # Create Chunks
        chunk_1 = Chunk(
            id=str(uuid.uuid4()),
            source_id=src_id,
            idx=0,
            text="We chose PostgreSQL because the reporting queries need joins across tasks and owners.",
            location="section 3.2",
        )
        chunk_2 = Chunk(
            id=str(uuid.uuid4()),
            source_id=src_id,
            idx=1,
            text="Sync work stopped here; waiting on the rate-limit decision.",
            location="lines 40-52",
        )
        db.add(chunk_1)
        db.add(chunk_2)
        db.commit()

        # Run extraction pipeline
        claims = process_and_persist_project_claims(project_id=proj_id, db=db)
        assert len(claims) >= 2

        # Verify claim codes, status, and evidence excerpt
        codes = [c.code for c in claims]
        assert "C-001" in codes
        assert "C-002" in codes

        for c in claims:
            assert c.status == "NEEDS_REVIEW"  # proposal rule: initial status is never auto-VERIFIED
            assert c.evidence_excerpt is not None
            assert len(c.evidence_excerpt) > 0

    finally:
        db.close()


def test_restricted_sources_excluded_from_extraction():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Restricted Test Project")
        db.add(project)

        src_id = str(uuid.uuid4())
        # Restricted source
        source = Source(
            id=src_id,
            project_id=proj_id,
            filename="confidential_passwords.txt",
            file_type="txt",
            restricted=True,
        )
        db.add(source)

        chunk = Chunk(
            id=str(uuid.uuid4()),
            source_id=src_id,
            idx=0,
            text="Production AWS Secret Key = AKIAIOSFODNN7EXAMPLE",
            location="line 1",
        )
        db.add(chunk)
        db.commit()

        claims = process_and_persist_project_claims(project_id=proj_id, db=db)
        # Should be empty because source was marked restricted!
        assert len(claims) == 0

    finally:
        db.close()
