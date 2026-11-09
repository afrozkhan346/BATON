import os
import re
import uuid
import logging
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from app.db import Claim, Gap, Source
from app.schemas import ConflictCheckResult
from app.services.llm import llm_service

logger = logging.getLogger("baton.conflicts")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "conflicts.md")


def load_conflict_prompt() -> str:
    if os.path.exists(PROMPT_PATH):
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "Do these two statements contradict? Statement 1: {statement_1}, Statement 2: {statement_2}"


def extract_keywords(text: str) -> set:
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    stop_words = {
        "the", "and", "for", "with", "this", "that", "from", "was",
        "were", "has", "have", "had", "been", "using", "use", "project",
    }
    return {w for w in words if w not in stop_words}


def check_ownership_conflict(claim1: Claim, claim2: Claim) -> Optional[Tuple[bool, str]]:
    """Rule-based pass for ownership: same module/task but different assigned owners."""
    if claim1.type not in ["ownership", "task"] or claim2.type not in ["ownership", "task"]:
        return None

    # Check for common module/subject keywords (auth, database, sync, deploy, ui, api, cache)
    kw1 = extract_keywords(claim1.statement)
    kw2 = extract_keywords(claim2.statement)
    common = kw1.intersection(kw2)

    # If they share component keywords but differ in text
    if any(k in common for k in ["auth", "database", "sync", "deploy", "api", "cache", "frontend", "backend"]):
        # Simple extraction of "owned by X" / "owner: X" or string diff
        owner_patterns = [r"owned by ([A-Za-z\.\s]+)", r"owner:\s*([A-Za-z\.\s]+)", r"([A-Za-z\.\s]+) owns"]
        o1 = None
        o2 = None
        for p in owner_patterns:
            m1 = re.search(p, claim1.statement, re.IGNORECASE)
            if m1:
                o1 = m1.group(1).strip()
            m2 = re.search(p, claim2.statement, re.IGNORECASE)
            if m2:
                o2 = m2.group(1).strip()

        if o1 and o2 and o1.lower() != o2.lower():
            return True, f"Conflicting owners for {', '.join(common)}: '{o1}' vs '{o2}'."

    return None


def evaluate_contradiction_llm(
    claim1: Claim,
    claim2: Claim,
    source1_name: str,
    source2_name: str,
) -> Tuple[bool, str]:
    """LLM pass: compares two related statements to detect contradictions."""
    prompt_template = load_conflict_prompt()
    formatted_prompt = prompt_template.format(
        source_1=source1_name,
        date_1=str(claim1.source_date or "undated"),
        statement_1=claim1.statement,
        source_2=source2_name,
        date_2=str(claim2.source_date or "undated"),
        statement_2=claim2.statement,
    )

    try:
        res: ConflictCheckResult = llm_service.complete_json(
            prompt=formatted_prompt,
            schema=ConflictCheckResult,
            system_instruction="You are BATON's Contradiction Auditor. Determine if two statements directly oppose or contradict each other.",
        )
        return res.contradict, res.note
    except Exception as e:
        logger.warning(f"Conflict check LLM call failed: {e}")
        return False, f"LLM comparison fallback: {e}"


def detect_and_persist_project_conflicts(project_id: str, db: Session) -> List[Tuple[Claim, Claim]]:
    """Finds and links contradictory claims, updating their status to CONFLICT and logging gaps."""
    claims = db.query(Claim).filter(
        Claim.project_id == project_id,
        Claim.status != "REJECTED",
    ).all()

    sources = {s.id: s.filename for s in db.query(Source).filter(Source.project_id == project_id).all()}
    detected_conflicts: List[Tuple[Claim, Claim]] = []

    for i in range(len(claims)):
        for j in range(i + 1, len(claims)):
            c1 = claims[i]
            c2 = claims[j]

            # Don't compare same source + chunk
            if c1.source_id == c2.source_id and c1.chunk_id == c2.chunk_id:
                continue

            # 1. Rule-based ownership pass
            rule_res = check_ownership_conflict(c1, c2)
            is_conflict = False
            note = ""

            if rule_res:
                is_conflict, note = rule_res
            else:
                # 2. Candidate filter: same type and keyword overlap >= 2
                if c1.type == c2.type:
                    kw1 = extract_keywords(c1.statement)
                    kw2 = extract_keywords(c2.statement)
                    if len(kw1.intersection(kw2)) >= 2:
                        src1_name = sources.get(c1.source_id, "Source 1")
                        src2_name = sources.get(c2.source_id, "Source 2")
                        is_conflict, note = evaluate_contradiction_llm(c1, c2, src1_name, src2_name)

            if is_conflict:
                # Set status CONFLICT
                c1.status = "CONFLICT"
                c2.status = "CONFLICT"

                # Link mutual conflicts
                cw1 = list(c1.conflict_with or [])
                if c2.id not in cw1:
                    cw1.append(c2.id)
                c1.conflict_with = cw1

                cw2 = list(c2.conflict_with or [])
                if c1.id not in cw2:
                    cw2.append(c1.id)
                c2.conflict_with = cw2

                # Record a conflicting_records gap in the gaps table
                existing_gap = db.query(Gap).filter(
                    Gap.project_id == project_id,
                    Gap.kind == "conflicting_records",
                    Gap.related_claim_id == c1.id,
                ).first()

                if not existing_gap:
                    gap_obj = Gap(
                        id=str(uuid.uuid4()),
                        project_id=project_id,
                        kind="conflicting_records",
                        description=f"Conflicting project records: {note}",
                        related_claim_id=c1.id,
                        follow_up_question=f"Which record is accurate: '{c1.statement}' or '{c2.statement}'?",
                        status="open",
                    )
                    db.add(gap_obj)

                detected_conflicts.append((c1, c2))

    db.commit()
    return detected_conflicts
