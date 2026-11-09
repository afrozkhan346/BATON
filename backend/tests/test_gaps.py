import pytest
import uuid
from app.db import SessionLocal, Project, Claim, Gap
from app.services.gaps import (
    detect_claim_gaps,
    generate_follow_up_question,
    detect_and_persist_project_gaps,
)


def test_detect_unexplained_decision():
    claim = Claim(
        id=str(uuid.uuid4()),
        type="decision",
        statement="We switched the hashing algorithm to Argon2id.",
        evidence_excerpt="Argon2id hashing is configured in auth.py.",  # No reason provided!
    )
    gaps = detect_claim_gaps(claim)
    assert len(gaps) >= 1
    assert any(g["kind"] == "unexplained_decision" for g in gaps)


def test_detect_missing_owner():
    claim = Claim(
        id=str(uuid.uuid4()),
        type="task",
        statement="Implement inventory reconciliation batch job.",
        evidence_excerpt="Need to write reconciliation job.",  # No owner assigned!
    )
    gaps = detect_claim_gaps(claim)
    assert len(gaps) >= 1
    assert any(g["kind"] == "missing_owner" for g in gaps)


def test_detect_open_question_on_paused_work():
    claim = Claim(
        id=str(uuid.uuid4()),
        type="blocker",
        statement="Sync endpoint paused waiting on rate-limit decision.",
        evidence_excerpt="Sync work stopped here; waiting on the rate-limit decision.",
    )
    gaps = detect_claim_gaps(claim)
    assert len(gaps) >= 1
    assert any(g["kind"] == "open_question" for g in gaps)


def test_generate_follow_up_question():
    q = generate_follow_up_question(
        kind="missing_owner",
        statement="Sync endpoint has no owner.",
        source="sprint_notes.txt",
    )
    assert isinstance(q, str)
    assert len(q) > 10
    assert "?" in q


def test_detect_and_persist_project_gaps_e2e():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Gap Detection E2E")
        db.add(project)

        # Claim with gap
        c = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            type="task",
            statement="Fix database connection pool exhaustion under load.",
            evidence_excerpt="Connection pool runs out of sockets under load.",
            status="NEEDS_REVIEW",
        )
        db.add(c)
        db.commit()

        # Run gap detection
        gaps = detect_and_persist_project_gaps(proj_id, db)
        assert len(gaps) >= 1
        gap = gaps[0]
        assert gap.status == "open"
        assert gap.follow_up_question is not None
        assert gap.related_claim_id == c.id

        # Idempotency / Deduplication check: running again shouldn't duplicate
        gaps_second_run = detect_and_persist_project_gaps(proj_id, db)
        assert len(gaps_second_run) == 0

    finally:
        db.close()
