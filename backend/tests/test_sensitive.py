import pytest
import uuid
from app.db import SessionLocal, Project, Source, Chunk, ExclusionLog, Claim
from app.services.sensitive import screen_and_redact, enforce_source_authorization
from app.services.extract import process_and_persist_project_claims


def test_screen_and_redact_secrets():
    text = (
        "OpenAI Key: sk-abcdefghijklmnopqrstuvwxyz123456\n"
        "AWS Access: AKIAIOSFODNN7EXAMPLE\n"
        "GitHub: ghp_1234567890abcdefghijklmnopqrstuvwxyz\n"
        "Contact: admin@example.com or +1 (555) 234-5678\n"
        "password = 'super_secret_value_123'"
    )

    redacted, entries = screen_and_redact(text)

    assert "sk-abcdef" not in redacted
    assert "[REDACTED:OPENAI_KEY]" in redacted

    assert "AKIAIOSFODNN7EXAMPLE" not in redacted
    assert "[REDACTED:AWS_KEY]" in redacted

    assert "ghp_1234567890" not in redacted
    assert "[REDACTED:GITHUB_TOKEN]" in redacted

    assert "admin@example.com" not in redacted
    assert "[REDACTED:EMAIL]" in redacted

    assert "555" not in redacted
    assert "[REDACTED:PHONE]" in redacted

    assert "super_secret_value_123" not in redacted
    assert "[REDACTED:PASSWORD]" in redacted

    assert len(entries) >= 5


def test_screen_and_redact_logs_to_db():
    db = SessionLocal()
    try:
        src_id = str(uuid.uuid4())
        text = "Database prod key: sk-live1234567890abcdef1234567890"
        redacted, entries = screen_and_redact(text, source_id=src_id, db=db)

        logs = db.query(ExclusionLog).filter(ExclusionLog.source_id == src_id).all()
        assert len(logs) >= 1
        assert logs[0].reason == "sensitive_redacted"
        assert "OPENAI_KEY" in logs[0].detail

    finally:
        db.close()


def test_enforce_source_authorization():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Auth Enforcement Test")
        db.add(project)

        # Restricted Source
        src_restricted = Source(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            filename="confidential_payroll.csv",
            file_type="csv",
            restricted=True,
        )
        # Normal Source
        src_public = Source(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            filename="readme.txt",
            file_type="txt",
            restricted=False,
        )
        db.add(src_restricted)
        db.add(src_public)
        db.commit()

        # Check authorization
        assert enforce_source_authorization(src_restricted, db) is False
        assert enforce_source_authorization(src_public, db) is True

        # Check exclusion log
        log = db.query(ExclusionLog).filter(ExclusionLog.source_id == src_restricted.id).first()
        assert log is not None
        assert log.reason == "restricted"
        assert "confidential_payroll.csv" in log.detail

    finally:
        db.close()


def test_restricted_data_never_leaks_into_claims():
    db = SessionLocal()
    try:
        proj_id = str(uuid.uuid4())
        project = Project(id=proj_id, name="Zero Leakage Test")
        db.add(project)

        src = Source(
            id=str(uuid.uuid4()),
            project_id=proj_id,
            filename="secrets.txt",
            file_type="txt",
            restricted=True,  # Restricted!
        )
        db.add(src)

        chunk = Chunk(
            id=str(uuid.uuid4()),
            source_id=src.id,
            idx=0,
            text="Root password = admin_master_super_pass_2026",
            location="line 1",
        )
        db.add(chunk)
        db.commit()

        claims = process_and_persist_project_claims(proj_id, db)
        assert len(claims) == 0  # Zero claims created!

        # Check exclusion log recorded
        log = db.query(ExclusionLog).filter(ExclusionLog.source_id == src.id).first()
        assert log is not None
        assert log.reason == "restricted"

    finally:
        db.close()
