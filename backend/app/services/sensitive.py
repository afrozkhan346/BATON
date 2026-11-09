import re
import uuid
import logging
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.db import ExclusionLog, Source

logger = logging.getLogger("baton.sensitive")

# Sensitive detection patterns
PATTERNS = {
    "OPENAI_KEY": re.compile(r"\bsk-[a-zA-Z0-9_-]{20,}\b"),
    "AWS_KEY": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "GITHUB_TOKEN": re.compile(r"\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b"),
    "EMAIL": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
    "PHONE": re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    "PASSWORD_ASSIGNMENT": re.compile(r"(?i)(password|secret_key|api_secret)\s*[:=]\s*['\"]?([^'\"\s\n]{6,})['\"]?"),
}


def screen_and_redact(
    text: str,
    source_id: Optional[str] = None,
    db: Optional[Session] = None,
) -> Tuple[str, List[Dict[str, Any]]]:
    """Screens text for API secrets, tokens, emails, and phone numbers.
    Replaces matches with [REDACTED:type] and logs exclusions to exclusion_log.
    """
    redacted_text = text
    redactions: List[Dict[str, Any]] = []

    for name, pattern in PATTERNS.items():
        matches = list(pattern.finditer(redacted_text))
        if not matches:
            continue

        for m in reversed(matches):  # reverse order to preserve string indices
            matched_str = m.group(0)
            tag = f"[REDACTED:{name}]"

            # If password assignment, keep key name and redact value
            if name == "PASSWORD_ASSIGNMENT":
                key_name = m.group(1)
                replacement = f"{key_name} = [REDACTED:PASSWORD]"
            else:
                replacement = tag

            start, end = m.span()
            redacted_text = redacted_text[:start] + replacement + redacted_text[end:]

            redaction_entry = {
                "type": name,
                "reason": "sensitive_redacted",
                "tag": tag,
            }
            redactions.append(redaction_entry)

            if db and source_id:
                log_entry = ExclusionLog(
                    id=str(uuid.uuid4()),
                    source_id=source_id,
                    reason="sensitive_redacted",
                    detail=f"Redacted sensitive {name} pattern prior to AI processing.",
                )
                db.add(log_entry)

    if db and redactions:
        db.commit()

    return redacted_text, redactions


def enforce_source_authorization(
    source: Source,
    db: Session,
) -> bool:
    """Enforces source-level authorization.
    If source.restricted == True, it is barred from AI extraction and logged.
    """
    if source.restricted:
        existing_log = db.query(ExclusionLog).filter(
            ExclusionLog.source_id == source.id,
            ExclusionLog.reason == "restricted",
        ).first()

        if not existing_log:
            log_entry = ExclusionLog(
                id=str(uuid.uuid4()),
                source_id=source.id,
                reason="restricted",
                detail=f"Restricted source '{source.filename}' barred from AI processing and successor export.",
            )
            db.add(log_entry)
            db.commit()

        return False  # Not authorized for AI pipeline
    return True  # Authorized
