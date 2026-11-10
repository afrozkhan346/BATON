from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db import get_db, User
from app.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)

router = APIRouter()


def seed_demo_users_if_needed(db: Session):
    """Seeds default demo accounts for Admin, Project Manager, and Employee if not present."""
    demo_accounts = [
        {
            "email": "admin@baton.ai",
            "full_name": "Antigravity Admin",
            "password": "password123",
            "role": "admin",
        },
        {
            "email": "pm@baton.ai",
            "full_name": "Rushikesh Bobade",
            "password": "password123",
            "role": "project_manager",
        },
        {
            "email": "employee@baton.ai",
            "full_name": "Afroz Khan",
            "password": "password123",
            "role": "employee",
        },
    ]

    for acc in demo_accounts:
        existing = db.query(User).filter(User.email == acc["email"]).first()
        if not existing:
            user = User(
                id=str(uuid.uuid4()),
                email=acc["email"],
                full_name=acc["full_name"],
                hashed_password=hash_password(acc["password"]),
                role=acc["role"],
            )
            db.add(user)
    db.commit()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    seed_demo_users_if_needed(db)

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    seed_demo_users_if_needed(db)
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            created_at=u.created_at,
        )
        for u in users
    ]
