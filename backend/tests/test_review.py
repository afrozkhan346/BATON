import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal, Project, Claim, Gap, ReviewEvent

client = TestClient(app)


def test_verify_claim_success():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        claim_id = str(uuid.uuid4())

        project = Project(id=proj_id, name="Review Test Project")
        claim = Claim(
            id=claim_id,
            project_id=proj_id,
            type="decision",
            statement="PostgreSQL chosen for relational reporting.",
            evidence_excerpt="We chose PostgreSQL because the reporting queries need joins across tasks and owners.",
            evidence_check={"exact_match": True, "semantic": "supports", "note": "Verified"},
            status="NEEDS_REVIEW",
        )
        db.add(project)
        db.add(claim)
        db.commit()

        # Submit verification action
        res = client.post(
            f"/api/v1/claims/{claim_id}/review",
            json={"reviewer": "Rushikesh", "action": "verify", "note": "Approved based on ADR"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "VERIFIED"

        # Check audit event
        db.refresh(claim)
        assert claim.status == "VERIFIED"
        assert len(claim.review_events) == 1
        assert claim.review_events[0].reviewer == "Rushikesh"
        assert claim.review_events[0].action == "verify"

    finally:
        db.close()


def test_verify_claim_fails_without_evidence():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        claim_id = str(uuid.uuid4())

        project = Project(id=proj_id, name="No Evidence Test")
        claim = Claim(
            id=claim_id,
            project_id=proj_id,
            type="task",
            statement="Arbitrary unsupported statement.",
            evidence_excerpt="",  # Empty evidence!
            status="NEEDS_REVIEW",
        )
        db.add(project)
        db.add(claim)
        db.commit()

        res = client.post(
            f"/api/v1/claims/{claim_id}/review",
            json={"reviewer": "Afroz", "action": "verify"},
        )
        assert res.status_code == 400
        assert "cannot be marked VERIFIED without supporting evidence" in res.json()["detail"]

    finally:
        db.close()


def test_verify_claim_fails_when_evidence_rejected():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        claim_id = str(uuid.uuid4())

        project = Project(id=proj_id, name="Failed Evidence Test")
        claim = Claim(
            id=claim_id,
            project_id=proj_id,
            type="task",
            statement="Fabricated statement.",
            evidence_excerpt="Some unrelated quote.",
            evidence_check={"exact_match": True, "semantic": "no", "note": "Evidence does not support claim"},
            status="UNSUPPORTED",
        )
        db.add(project)
        db.add(claim)
        db.commit()

        res = client.post(
            f"/api/v1/claims/{claim_id}/review",
            json={"reviewer": "Afroz", "action": "verify"},
        )
        assert res.status_code == 400
        assert "Evidence check failed" in res.json()["detail"]

    finally:
        db.close()


def test_edit_claim_resets_status_and_logs_audit():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        claim_id = str(uuid.uuid4())

        project = Project(id=proj_id, name="Edit Test")
        claim = Claim(
            id=claim_id,
            project_id=proj_id,
            type="decision",
            statement="Original statement.",
            status="VERIFIED",
        )
        db.add(project)
        db.add(claim)
        db.commit()

        # Edit statement
        res = client.post(
            f"/api/v1/claims/{claim_id}/review",
            json={
                "reviewer": "Rushikesh",
                "action": "edit",
                "statement": "Corrected and refined statement.",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["statement"] == "Corrected and refined statement."
        assert data["status"] == "NEEDS_REVIEW"  # Editing resets to NEEDS_REVIEW

        # History endpoint check
        hist_res = client.get(f"/api/v1/claims/{claim_id}/history")
        assert hist_res.status_code == 200
        history = hist_res.json()
        assert len(history) >= 1
        assert history[0]["action"] == "edit"
        assert history[0]["before"]["statement"] == "Original statement."
        assert history[0]["after"]["statement"] == "Corrected and refined statement."

    finally:
        db.close()


def test_reject_claim():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        claim_id = str(uuid.uuid4())

        project = Project(id=proj_id, name="Reject Test")
        claim = Claim(
            id=claim_id,
            project_id=proj_id,
            type="workaround",
            statement="Obsolete manual patch.",
            status="NEEDS_REVIEW",
        )
        db.add(project)
        db.add(claim)
        db.commit()

        res = client.post(
            f"/api/v1/claims/{claim_id}/review",
            json={"reviewer": "Rushikesh", "action": "reject", "note": "Obsolete workaround removed in v2"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "REJECTED"

    finally:
        db.close()


def test_resolve_gap_endpoint():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        gap_id = str(uuid.uuid4())

        project = Project(id=proj_id, name="Gap Resolution Test")
        gap = Gap(
            id=gap_id,
            project_id=proj_id,
            kind="missing_owner",
            description="Sync endpoint has no owner.",
            status="open",
        )
        db.add(project)
        db.add(gap)
        db.commit()

        res = client.post(
            f"/api/v1/gaps/{gap_id}/resolve",
            json={
                "reviewer": "Rushikesh",
                "resolution_note": "Assigned ownership to B. Sample for Round 2 integration.",
                "owner": "B. Sample",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "resolved"
        assert "Rushikesh" in data["resolution_note"]

    finally:
        db.close()
