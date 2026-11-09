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

    # 2. Get Dashboard
    dash_res = client.get(f"/api/v1/projects/{project_id}/dashboard")
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["project_id"] == project_id
    assert "claims_verified" in dash
    assert "needs_attention" in dash

    # 3. Get Handover Report
    rep_res = client.get(f"/api/v1/projects/{project_id}/report")
    assert rep_res.status_code == 200
    report = rep_res.json()
    assert report["project_name"] == "Inventory Service Test"
    assert "what_is_known" in report
    assert "what_remains_uncertain" in report
