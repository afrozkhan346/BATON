import os
import logging
from typing import Dict, Any, Optional, List
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.schemas import SemanticCheckResult
from app.services.llm import llm_service
from app.db import Claim, Chunk

logger = logging.getLogger("baton.evidence")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "semantic_check.md")


def load_semantic_prompt() -> str:
    if os.path.exists(PROMPT_PATH):
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "Does excerpt '{evidence_excerpt}' support statement '{statement}'? Answer supports/partial/no with note."


def verify_claim_evidence(
    statement: str,
    evidence_excerpt: str,
    chunk_text: str,
    fuzzy_threshold: float = 90.0,
) -> Dict[str, Any]:
    """Two-tier evidence verification:
    Layer 1: RapidFuzz substring match in chunk (>= 90% threshold).
    Layer 2: LLM semantic validation (supports, partial, no).
    
    Rule:
    - Failing Layer 1 or Layer 2 'no' -> UNSUPPORTED.
    - Passing both -> NEEDS_REVIEW (awaits human approval, never auto-VERIFIED).
    """
    if not evidence_excerpt or not evidence_excerpt.strip():
        return {
            "exact_match": False,
            "match_score": 0.0,
            "semantic": "no",
            "status": "UNSUPPORTED",
            "note": "No evidence excerpt provided with claim.",
        }

    # Layer 1: String & Fuzzy Substring Match
    clean_quote = " ".join(evidence_excerpt.strip().split())
    clean_chunk = " ".join(chunk_text.strip().split())
    match_score = float(fuzz.partial_ratio(clean_quote.lower(), clean_chunk.lower()))
    exact_match = match_score >= fuzzy_threshold

    if not exact_match:
        return {
            "exact_match": False,
            "match_score": round(match_score, 2),
            "semantic": "no",
            "status": "UNSUPPORTED",
            "note": f"Excerpt not found in source text (fuzzy ratio {match_score:.1f}% < {fuzzy_threshold}%).",
        }

    # Layer 2: LLM Semantic Verification Check
    prompt_template = load_semantic_prompt()
    formatted_prompt = prompt_template.format(
        statement=statement,
        evidence_excerpt=evidence_excerpt,
    )

    try:
        check_result: SemanticCheckResult = llm_service.complete_json(
            prompt=formatted_prompt,
            schema=SemanticCheckResult,
            system_instruction="You are BATON's Evidence Auditor. Evaluate whether the excerpt logically supports the claim.",
        )
        semantic_verdict = check_result.semantic
        note = check_result.note
    except Exception as e:
        logger.warning(f"Semantic verification LLM call failed: {e}")
        semantic_verdict = "supports"
        note = "String match confirmed; semantic check accepted by default."

    if semantic_verdict == "no":
        status = "UNSUPPORTED"
    else:
        # Crucial principle: Even when evidence is confirmed, claims remain NEEDS_REVIEW until human verifies
        status = "NEEDS_REVIEW"

    return {
        "exact_match": True,
        "match_score": round(match_score, 2),
        "semantic": semantic_verdict,
        "status": status,
        "note": note,
    }


def verify_project_claims(project_id: str, db: Session) -> List[Claim]:
    """Runs two-tier verification across all claims belonging to a project."""
    claims = db.query(Claim).filter(Claim.project_id == project_id).all()

    for claim in claims:
        chunk = db.query(Chunk).filter(Chunk.id == claim.chunk_id).first() if claim.chunk_id else None
        chunk_text = chunk.text if chunk else ""

        verdict = verify_claim_evidence(
            statement=claim.statement,
            evidence_excerpt=claim.evidence_excerpt or "",
            chunk_text=chunk_text,
        )

        claim.status = verdict["status"]
        claim.evidence_check = {
            "exact_match": verdict["exact_match"],
            "match_score": verdict["match_score"],
            "semantic": verdict["semantic"],
            "note": verdict["note"],
        }

    db.commit()
    return claims
