import pytest
import uuid
from app.db import SessionLocal, Project, Source, Claim, Gap
from app.services.conflicts import (
    check_ownership_conflict,
    detect_and_persist_project_conflicts,
)


def test_ownership_conflict_detection():
    c1 = Claim(
        id=str(uuid.uuid4()),
        type="ownership",
        statement="Auth module owned by A. Sample",
    )
    c2 = Claim(
        id=str(uuid.uuid4()),
        type="ownership",
        statement="Auth module owned by B. Sample",
    )

    result = check_ownership_conflict(c1, c2)
    assert result is not None
    is_conflict, note = result
    assert is_conflict is True
    assert "Conflicting owners" in note
    assert "A. Sample" in note and "B. Sample" in note


def test_detect_and_persist_project_conflicts_e2e():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Conflict Detection E2E")
        db.add(project)

        # Source 1: tasks.csv
        src1 = Source(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            filename="tasks.csv",
            file_type="csv",
        )
        # Source 2: chat_export.txt
        src2 = Source(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            filename="chat_export.txt",
            file_type="txt",
        )
        db.add(src1)
        db.add(src2)

        # Claim 1 in tasks.csv
        c1 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            code="C-031",
            type="ownership",
            statement="Auth module owned by A. Sample",
            source_id=src1.id,
            status="NEEDS_REVIEW",
            conflict_with=[],
        )
        # Claim 2 in chat_export.txt
        c2 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            code="C-032",
            type="ownership",
            statement="Auth module owned by B. Sample",
            source_id=src2.id,
            status="NEEDS_REVIEW",
            conflict_with=[],
        )
        # Claim 3: Non-conflicting claim
        c3 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            code="C-035",
            type="decision",
            statement="PostgreSQL database selected for relational reporting.",
            source_id=src1.id,
            status="NEEDS_REVIEW",
            conflict_with=[],
        )
        db.add(c1)
        db.add(c2)
        db.add(c3)
        db.commit()

        # Run conflict detection
        conflicts = detect_and_persist_project_conflicts(proj_id, db)
        assert len(conflicts) >= 1

        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)

        # Both claims must now have status CONFLICT
        assert c1.status == "CONFLICT"
        assert c2.status == "CONFLICT"

        # They must mutually reference each other
        assert c2.id in c1.conflict_with
        assert c1.id in c2.conflict_with

        # c3 should remain unaffected
        assert c3.status == "NEEDS_REVIEW"
        assert len(c3.conflict_with) == 0

        # Conflicting records gap created
        conflict_gap = db.query(Gap).filter(
            Gap.project_id == proj_id,
            Gap.kind == "conflicting_records",
        ).first()
        assert conflict_gap is not None
        assert "Auth module" in conflict_gap.follow_up_question or "owned by" in conflict_gap.follow_up_question

    finally:
        db.close()
