import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_projects_crud_and_dashboard():
    # 1. Create Project
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Inventory Service Test",
            "departing_member": "Alice",
            "successor": "Bob",
        },
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]
    assert project["name"] == "Inventory Service Test"

    # 2. Upload a Source file (Multipart)
    txt_file_content = b"Sprint 1: We implemented JWT auth.\nSprint 2: Paused sync endpoint."
    upload_res = client.post(
        f"/api/v1/projects/{project_id}/sources",
        files={"file": ("sprint_notes.txt", txt_file_content, "text/plain")},
        data={"owner": "Alice", "restricted": "false"},
    )
    assert upload_res.status_code == 201
    source = upload_res.json()
    assert source["filename"] == "sprint_notes.txt"
    assert source["status"] == "processed"

    # 3. List Sources
    sources_res = client.get(f"/api/v1/projects/{project_id}/sources")
    assert sources_res.status_code == 200
    sources = sources_res.json()
    assert len(sources) >= 1
    assert any(s["filename"] == "sprint_notes.txt" for s in sources)

    # 4. Get Dashboard
    dash_res = client.get(f"/api/v1/projects/{project_id}/dashboard")
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["project_id"] == project_id
    assert "claims_verified" in dash
    assert "needs_attention" in dash

    # 5. Get Handover Report
    rep_res = client.get(f"/api/v1/projects/{project_id}/report")
    assert rep_res.status_code == 200
    report = rep_res.json()
    assert report["project_name"] == "Inventory Service Test"
    assert "what_is_known" in report
    assert "what_remains_uncertain" in report
