import os
import re
import uuid
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.schemas import ExtractedClaim, ExtractionResult
from app.services.llm import llm_service
from app.db import Claim, Chunk, Source, Project
from app.services.sensitive import screen_and_redact, enforce_source_authorization

logger = logging.getLogger("baton.extract")
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "extract.md")


def load_extract_prompt() -> str:
    if os.path.exists(PROMPT_PATH):
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "Extract verifiable claims with verbatim quotes from: {chunk_text}"


def normalize_text(text: str) -> str:
    """Normalizes text for deduplication."""
    return re.sub(r"\s+", " ", text.strip().lower())


def deduplicate_claims(claims: List[ExtractedClaim]) -> List[ExtractedClaim]:
    """Deduplicates claims with near-identical statements and identical type."""
    unique: List[ExtractedClaim] = []
    seen = set()

    for c in claims:
        norm_key = (c.type, normalize_text(c.statement))
        if norm_key not in seen:
            seen.add(norm_key)
            unique.append(c)

    return unique


def extract_claims_from_chunk(
    chunk_text: str,
    source_name: str,
    location: str,
    source_date: Optional[str] = None,
) -> List[ExtractedClaim]:
    """Runs LLM extraction on a single chunk with verbatim quote enforcement."""
    prompt_template = load_extract_prompt()
    formatted_prompt = prompt_template.format(
        source_name=source_name,
        location=location or "unknown",
        source_date=source_date or "undated",
        chunk_text=chunk_text,
    )

    try:
        result: ExtractionResult = llm_service.complete_json(
            prompt=formatted_prompt,
            schema=ExtractionResult,
            system_instruction="You are BATON's Knowledge Extraction Engine. Extract only explicitly stated claims with verbatim quotes.",
        )
        return result.claims
    except Exception as e:
        logger.error(f"Failed to extract claims from chunk: {e}")
        return []


def process_and_persist_project_claims(project_id: str, db: Session) -> List[Claim]:
    """Extracts claims from all unprocessed chunks in a project and persists them as NEEDS_REVIEW.
    Includes P2 sensitive screening and authorization filtering.
    """
    all_sources = db.query(Source).filter(Source.project_id == project_id).all()

    # P2: Screen sources for authorization
    authorized_sources = []
    for s in all_sources:
        if enforce_source_authorization(s, db):
            authorized_sources.append(s)

    existing_claims_count = db.query(Claim).filter(Claim.project_id == project_id).count()
    claim_counter = existing_claims_count + 1

    all_created_claims: List[Claim] = []

    for source in authorized_sources:
        chunks = db.query(Chunk).filter(Chunk.source_id == source.id).order_by(Chunk.idx).all()
        extracted_from_source: List[tuple[ExtractedClaim, Chunk]] = []

        for chunk in chunks:
            # P2: Screen and redact sensitive secrets/PII before chunk is sent to LLM
            sanitized_text, _ = screen_and_redact(chunk.text, source_id=source.id, db=db)

            claims = extract_claims_from_chunk(
                chunk_text=sanitized_text,
                source_name=source.filename,
                location=chunk.location or f"chunk {chunk.idx}",
                source_date=str(source.source_date) if source.source_date else None,
            )
            for c in claims:
                extracted_from_source.append((c, chunk))

        # Deduplicate per source
        seen_keys = set()
        for c, chunk in extracted_from_source:
            norm_key = (c.type, normalize_text(c.statement))
            if norm_key in seen_keys:
                continue
            seen_keys.add(norm_key)

            claim_record = Claim(
                id=str(uuid.uuid4()),
                project_id=project_id,
                code=f"C-{claim_counter:03d}",
                type=c.type,
                statement=c.statement,
                source_id=source.id,
                chunk_id=chunk.id,
                evidence_excerpt=c.evidence_excerpt,
                source_date=source.source_date,
                location=chunk.location,
                confidence=c.confidence,
                status="NEEDS_REVIEW",  # Mandatory initial status: nothing is auto-VERIFIED
                evidence_check=None,
                conflict_with=[],
            )
            db.add(claim_record)
            all_created_claims.append(claim_record)
            claim_counter += 1

    db.commit()
    return all_created_claims
