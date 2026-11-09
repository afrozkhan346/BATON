import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal, Project, Source, Claim, Gap
from app.services.report import generate_handover_report, calculate_dashboard_metrics

client = TestClient(app)


def test_handover_report_partitioning():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(
            id=proj_id,
            name="Inventory Service",
            departing_member="Alice",
            successor="Bob",
        )
        src = Source(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            filename="architecture_notes_v2.docx",
            file_type="docx",
        )
        db.add(project)
        db.add(src)

        # 1. Verified Claim
        c1 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            code="C-014",
            type="decision",
            statement="PostgreSQL chosen for relational reporting.",
            source_id=src.id,
            status="VERIFIED",
        )
        # 2. Uncertain / Needs Review Claim
        c2 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            code="C-021",
            type="blocker",
            statement="Sync endpoint paused before completion.",
            source_id=src.id,
            status="NEEDS_REVIEW",
        )
        # 3. Unsupported Claim
        c3 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            code="C-027",
            type="workaround",
            statement="Deploy script requires manual environment fix.",
            source_id=src.id,
            status="UNSUPPORTED",
            evidence_check={"note": "Quote not found in document"},
        )
        # 4. Open Gap
        gap = Gap(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            kind="missing_owner",
            description="Sync endpoint has no designated owner.",
            follow_up_question="Who will take ownership of the sync endpoint?",
            status="open",
        )
        db.add(c1)
        db.add(c2)
        db.add(c3)
        db.add(gap)
        db.commit()

        # Generate report
        report = generate_handover_report(proj_id, db)

        # Verify Partitioning
        assert len(report.what_is_known) == 1
        assert report.what_is_known[0].code == "C-014"
        assert report.what_is_known[0].status == "VERIFIED"

        assert len(report.what_remains_uncertain) == 2
        uncertain_codes = [u.code for u in report.what_remains_uncertain]
        assert "C-021" in uncertain_codes
        assert "C-027" in uncertain_codes

        assert len(report.what_needs_attention) == 1
        assert report.what_needs_attention[0]["kind"] == "missing_owner"

        assert report.handover_ready is False
        assert "DRAFT" in report.status

    finally:
        db.close()


def test_handover_approval_guard():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Approval Guard Test")
        c = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            type="decision",
            statement="Kafka chosen for event streaming.",
            status="NEEDS_REVIEW",  # Unreviewed!
        )
        db.add(project)
        db.add(c)
        db.commit()

        # Attempt approval -> should fail with 400
        fail_res = client.post(f"/api/v1/projects/{proj_id}/approve")
        assert fail_res.status_code == 400
        assert "pending review" in fail_res.json()["detail"]

        # Human verifies the claim
        c.status = "VERIFIED"
        c.evidence_excerpt = "Kafka chosen for event streaming."
        db.commit()

        # Re-attempt approval -> should succeed
        success_res = client.post(f"/api/v1/projects/{proj_id}/approve")
        assert success_res.status_code == 200
        assert success_res.json()["status"] == "APPROVED"

    finally:
        db.close()


def test_dashboard_metrics_calculation():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(
            id=proj_id,
            name="Dashboard Test Project",
            departing_member="Alice",
            successor="Bob",
        )
        db.add(project)

        c1 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            type="decision",
            statement="Fact 1",
            status="VERIFIED",
        )
        c2 = Claim(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            type="task",
            statement="Fact 2",
            status="NEEDS_REVIEW",
        )
        gap = Gap(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            kind="missing_owner",
            description="Task 2 has no owner",
            status="open",
        )
        db.add(c1)
        db.add(c2)
        db.add(gap)
        db.commit()

        dashboard = calculate_dashboard_metrics(proj_id, db)
        assert dashboard.claims_total == 2
        assert dashboard.claims_verified == 1
        assert dashboard.approvals_pending == 1
        assert dashboard.gaps_total == 1
        assert dashboard.gaps_resolved == 0
        assert dashboard.handover_ready is False
        assert len(dashboard.needs_attention) >= 1

    finally:
        db.close()
