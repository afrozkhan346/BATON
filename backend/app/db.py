import os
import uuid
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Text,
    Boolean,
    Date,
    DateTime,
    Integer,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from app.config import settings

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    departing_member = Column(String(255), nullable=True)
    successor = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    sources = relationship("Source", back_populates="project", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="project", cascade="all, delete-orphan")
    gaps = relationship("Gap", back_populates="project", cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    owner = Column(String(255), nullable=True)
    restricted = Column(Boolean, default=False)
    source_date = Column(Date, nullable=True)
    status = Column(String(50), default="uploaded")  # uploaded | processed | excluded | failed
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="sources")
    chunks = relationship("Chunk", back_populates="source", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="source")


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    idx = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    source = relationship("Source", back_populates="chunks")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=True)  # e.g. "C-014"
    type = Column(String(50), nullable=False)  # decision | task | blocker | dependency | workaround | ownership | next_action
    statement = Column(Text, nullable=False)
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    evidence_excerpt = Column(Text, nullable=True)
    source_date = Column(Date, nullable=True)
    location = Column(String(255), nullable=True)
    confidence = Column(String(20), default="medium")  # high | medium | low
    status = Column(String(50), nullable=False, default="NEEDS_REVIEW")  # VERIFIED | NEEDS_REVIEW | UNSUPPORTED | CONFLICT | REJECTED
    evidence_check = Column(JSON, nullable=True)  # {exact_match: bool, semantic: str, note: str}
    conflict_with = Column(JSON, default=list)  # list of claim ids
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="claims")
    source = relationship("Source", back_populates="claims")
    review_events = relationship("ReviewEvent", back_populates="claim", cascade="all, delete-orphan")


class Gap(Base):
    __tablename__ = "gaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(50), nullable=False)  # unexplained_decision | missing_owner | incomplete_docs | conflicting_records | open_question
    description = Column(Text, nullable=False)
    related_claim_id = Column(String(36), ForeignKey("claims.id", ondelete="SET NULL"), nullable=True)
    follow_up_question = Column(Text, nullable=True)
    status = Column(String(50), default="open")  # open | resolved
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="gaps")


class ReviewEvent(Base):
    __tablename__ = "review_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    reviewer = Column(String(255), nullable=False)
    action = Column(String(50), nullable=False)  # verify | edit | reject | approve | add_context
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    claim = relationship("Claim", back_populates="review_events")


class ExclusionLog(Base):
    __tablename__ = "exclusion_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(100), nullable=False)  # restricted | sensitive_redacted
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# --- Engine & Session Setup ---
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


# Auto-create tables for local development/testing
init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
