import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal, User
from app.services.auth import hash_password, verify_password, create_access_token

client = TestClient(app)


def test_password_hashing():
    pwd = "secret_password_123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert "$" in hashed
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_register_and_login_flow():
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    pwd = "securepassword123"

    # 1. Register PM
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": pwd,
            "full_name": "Test Project Manager",
            "role": "project_manager",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email
    assert reg_data["user"]["role"] == "project_manager"

    token = reg_data["access_token"]

    # 2. Duplicate registration fails
    dup_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": pwd,
            "full_name": "Duplicate User",
            "role": "employee",
        },
    )
    assert dup_res.status_code == 400

    # 3. Login with valid credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["user"]["role"] == "project_manager"

    # 4. Login with invalid password fails
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401

    # 5. Access /me endpoint with token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == email
    assert me_data["role"] == "project_manager"


def test_demo_accounts_seeded():
    # Login as seeded admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@baton.ai", "password": "password123"},
    )
    assert admin_login.status_code == 200
    data = admin_login.json()
    assert data["user"]["role"] == "admin"

    # List users
    users_res = client.get("/api/v1/auth/users")
    assert users_res.status_code == 200
    users = users_res.json()
    roles = {u["role"] for u in users}
    assert "admin" in roles
    assert "project_manager" in roles
    assert "employee" in roles
