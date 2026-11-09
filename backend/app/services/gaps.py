import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import Claim, Gap, Project
from app.services.llm import llm_service

logger = logging.getLogger("baton.gaps")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "gaps.md")

REASON_KEYWORDS = [
    "because", "due to", "in order to", "reason", "so that",
    "since", "chosen for", "selected for", "designed to", "needed for",
]
PAUSED_KEYWORDS = [
    "paused", "pause", "unfinished", "tbd", "waiting",
    "blocked", "deferred", "pending", "incomplete", "stopped",
]


class GapQuestionOutput(BaseModel):
    follow_up_question: str = "What are the next steps and required conditions to resolve this?"


def load_gap_prompt() -> str:
    if os.path.exists(PROMPT_PATH):
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "Formulate a single concise follow-up question for: {kind} - {statement}"


def generate_follow_up_question(kind: str, statement: str, source: str = "project record") -> str:
    """Generates a high-leverage follow-up question for a successor or departing engineer."""
    prompt_template = load_gap_prompt()
    formatted_prompt = prompt_template.format(
        kind=kind,
        statement=statement,
        source=source,
    )

    try:
        res = llm_service.complete_json(
            prompt=formatted_prompt,
            schema=GapQuestionOutput,
            system_instruction="You are BATON's Knowledge Gap Analyst. Formulate a single, direct follow-up question.",
        )
        if res.follow_up_question and res.follow_up_question.strip():
            return res.follow_up_question.strip()
    except Exception as e:
        logger.info(f"LLM question generation fallback: {e}")

    # Deterministic fallback rules based on kind
    if kind == "unexplained_decision":
        return f"What was the technical rationale or trade-off for: '{statement}'?"
    elif kind == "missing_owner":
        return f"Who is designated as the primary owner for: '{statement}'?"
    elif kind == "incomplete_docs":
        return f"Where is the prerequisite documentation or specification for: '{statement}'?"
    else:
        return f"What are the outstanding blockers and next steps required to resolve: '{statement}'?"


def detect_claim_gaps(claim: Claim) -> List[Dict[str, Any]]:
    """Analyzes a single claim for missing context, owners, or explanations."""
    gaps: List[Dict[str, Any]] = []
    text_lower = claim.statement.lower()
    evidence_lower = (claim.evidence_excerpt or "").lower()
    full_text = f"{text_lower} {evidence_lower}"

    # 1. Unexplained Decision
    if claim.type == "decision":
        has_reason = any(rk in full_text for rk in REASON_KEYWORDS)
        if not has_reason:
            gaps.append({
                "kind": "unexplained_decision",
                "description": f"Architectural decision lacks documented rationale: {claim.statement}",
                "related_claim_id": claim.id,
            })

    # 2. Missing Owner
    if claim.type in ["task", "ownership"]:
        has_owner = bool(claim.statement and ("owned by" in text_lower or "owner:" in text_lower or "assigned to" in text_lower))
        if not has_owner:
            gaps.append({
                "kind": "missing_owner",
                "description": f"Task or module lacks a designated owner: {claim.statement}",
                "related_claim_id": claim.id,
            })

    # 3. Open Question / Paused Work
    is_paused = any(pk in full_text for pk in PAUSED_KEYWORDS) or claim.type == "blocker"
    if is_paused:
        gaps.append({
            "kind": "open_question",
            "description": f"Work item is paused, incomplete, or blocked: {claim.statement}",
            "related_claim_id": claim.id,
        })

    return gaps


def detect_and_persist_project_gaps(project_id: str, db: Session) -> List[Gap]:
    """Detects knowledge gaps across all project claims and saves them to the gaps table."""
    claims = db.query(Claim).filter(
        Claim.project_id == project_id,
        Claim.status != "REJECTED",
    ).all()

    existing_gaps = db.query(Gap).filter(Gap.project_id == project_id).all()
    existing_gap_keys = {(g.related_claim_id, g.kind) for g in existing_gaps}

    new_gaps: List[Gap] = []

    for claim in claims:
        detected = detect_claim_gaps(claim)
        for d in detected:
            key = (d["related_claim_id"], d["kind"])
            if key in existing_gap_keys:
                continue
            existing_gap_keys.add(key)

            question = generate_follow_up_question(
                kind=d["kind"],
                statement=claim.statement,
                source=claim.location or "source",
            )

            gap_obj = Gap(
                id=str(uuid.uuid4()),
                project_id=project_id,
                kind=d["kind"],
                description=d["description"],
                related_claim_id=claim.id,
                follow_up_question=question,
                status="open",
                resolution_note=None,
            )
            db.add(gap_obj)
            new_gaps.append(gap_obj)

    db.commit()
    return new_gaps
