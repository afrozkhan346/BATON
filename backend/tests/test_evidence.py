import pytest
import uuid
from app.db import SessionLocal, Project, Source, Chunk, Claim
from app.services.evidence import verify_claim_evidence, verify_project_claims


def test_verify_claim_exact_match_success():
    chunk_text = "We chose PostgreSQL because the reporting queries need joins across tasks and owners."
    quote = "We chose PostgreSQL because the reporting queries need joins across tasks and owners."
    statement = "PostgreSQL was selected for relational queries."

    result = verify_claim_evidence(
        statement=statement,
        evidence_excerpt=quote,
        chunk_text=chunk_text,
    )

    assert result["exact_match"] is True
    assert result["match_score"] >= 95.0
    assert result["semantic"] in ["supports", "partial"]
    assert result["status"] == "NEEDS_REVIEW"  # Must NEVER be auto-VERIFIED


def test_verify_claim_fabricated_quote_unsupported():
    chunk_text = "The application uses React with Tailwind CSS on the frontend."
    fake_quote = "We migrated to Kubernetes to improve deployment resilience."
    statement = "Kubernetes is used for deployment."

    result = verify_claim_evidence(
        statement=statement,
        evidence_excerpt=fake_quote,
        chunk_text=chunk_text,
    )

    assert result["exact_match"] is False
    assert result["status"] == "UNSUPPORTED"
    assert "not found in source" in result["note"]


def test_verify_claim_empty_evidence_unsupported():
    chunk_text = "Some random text."
    result = verify_claim_evidence(
        statement="Important architectural choice.",
        evidence_excerpt="",
        chunk_text=chunk_text,
    )

    assert result["exact_match"] is False
    assert result["status"] == "UNSUPPORTED"
    assert "No evidence" in result["note"]


def test_verify_claim_semantic_contradiction_unsupported(monkeypatch):
    from app.services.llm import llm_service
    from app.schemas import SemanticCheckResult

    chunk_text = "We explicitly decided NOT to use MongoDB because of join requirements."
    quote = "We explicitly decided NOT to use MongoDB"
    statement = "MongoDB was chosen as the primary database."

    # Force LLM mock to return semantic "no"
    def mock_no_semantic(prompt, schema):
        return SemanticCheckResult(semantic="no", note="Quote states MongoDB was NOT chosen.")

    monkeypatch.setattr(llm_service, "_complete_mock", mock_no_semantic)

    result = verify_claim_evidence(
        statement=statement,
        evidence_excerpt=quote,
        chunk_text=chunk_text,
    )

    assert result["exact_match"] is True
    assert result["semantic"] == "no"
    assert result["status"] == "UNSUPPORTED"


def test_verify_project_claims_database_persistence():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Evidence Verification DB Test")
        db.add(project)

        src_id = str(uuid.uuid4())
        source = Source(
            id=src_id,
            project_id=proj_id,
            filename="sprint_notes.txt",
            file_type="txt",
        )
        db.add(source)

        chunk_id = str(uuid.uuid4())
        chunk = Chunk(
            id=chunk_id,
            source_id=src_id,
            idx=0,
            text="Sync work stopped here; waiting on the rate-limit decision.",
            location="line 10",
        )
        db.add(chunk)

        # Claim 1: Valid Quote
        c1 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            type="blocker",
            statement="Sync endpoint paused waiting on rate-limit decision.",
            chunk_id=chunk_id,
            evidence_excerpt="Sync work stopped here; waiting on the rate-limit decision.",
            status="NEEDS_REVIEW",
        )
        # Claim 2: Hallucinated Quote
        c2 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            type="decision",
            statement="Redis cache was configured.",
            chunk_id=chunk_id,
            evidence_excerpt="Redis caching enabled on port 6379.",  # Not in chunk!
            status="NEEDS_REVIEW",
        )
        db.add(c1)
        db.add(c2)
        db.commit()

        # Run verification
        claims = verify_project_claims(proj_id, db)
        assert len(claims) == 2

        db.refresh(c1)
        db.refresh(c2)

        # c1 should be verified string match -> NEEDS_REVIEW
        assert c1.status == "NEEDS_REVIEW"
        assert c1.evidence_check["exact_match"] is True

        # c2 should be UNSUPPORTED
        assert c2.status == "UNSUPPORTED"
        assert c2.evidence_check["exact_match"] is False

    finally:
        db.close()
