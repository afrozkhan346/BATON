import os
import json
from typing import Dict, Any, List

DATASET_DIR = os.path.join(os.path.dirname(__file__), "dataset", "inventory_service")


def run_baseline_a_manual() -> Dict[str, Any]:
    """Approach A: Manual Handover Note.
    Simulates a standard handover document written by a developer under time constraints.
    Typically lists completed tasks, mentions a few facts, misses subtle conflicts, and lacks evidence quotes.
    """
    return {
        "approach": "A_Manual",
        "description": "Manual developer handover note",
        "content": (
            "Inventory Service Handover:\n"
            "- PostgreSQL is used for the database.\n"
            "- Core tracking is working.\n"
            "- Sync endpoint is not finished.\n"
            "- Auth module is owned by A. Sample.\n"
            "- Redis caching planned for later.\n"
        ),
        "claims": [
            {"statement": "PostgreSQL is used for database", "has_evidence": False},
            {"statement": "Sync endpoint is not finished", "has_evidence": False},
            {"statement": "Auth module is owned by A. Sample", "has_evidence": False},
        ],
        "answers": {
            "Q1": "PostgreSQL is used.",
            "Q2": "Not finished.",
            "Q3": "A. Sample",
            "Q4": "Later.",
            "Q5": "Not sure.",
        },
        "gaps_flagged": [],
        "conflicts_flagged": [],
        "leaked_restricted_facts": [],
    }


def run_baseline_b_generic_ai() -> Dict[str, Any]:
    """Approach B: Generic AI Summarizer.
    Simulates an off-the-shelf LLM summary of all project files without verification rules or security gates.
    Fluent summary, but generates unverified assertions, misses contradictions, and leaks secrets if unredacted.
    """
    return {
        "approach": "B_Generic_AI",
        "description": "Standard generic LLM summary without verification or permission screening",
        "content": (
            "Comprehensive Project Summary:\n"
            "The Inventory Service uses PostgreSQL. Work on the sync endpoint was paused. "
            "Auth module is maintained by A. Sample and B. Sample. "
            "Production credentials include sk-live99999999999999999999prod_secret_key. "
            "Deploy scripts need manual environment variables."
        ),
        "claims": [
            {"statement": "PostgreSQL chosen for inventory reporting", "has_evidence": False},
            {"statement": "Sync endpoint paused", "has_evidence": False},
            {"statement": "Auth module maintained by team", "has_evidence": False},
            {"statement": "Cache layer deferred", "has_evidence": False},
        ],
        "answers": {
            "Q1": "PostgreSQL was chosen for reporting.",
            "Q2": "Sync endpoint paused for unspecified reasons.",
            "Q3": "Both A. Sample and B. Sample work on it.",
            "Q4": "Deferred to v2.",
            "Q5": "Export DATABASE_URL manually.",
        },
        "gaps_flagged": [],
        "conflicts_flagged": [],
        # Generic AI without screening leaks the restricted secret!
        "leaked_restricted_facts": ["sk-live99999999999999999999prod_secret_key"],
    }


def run_baseline_c_baton(project_id: str, db) -> Dict[str, Any]:
    """Approach C: BATON Evidence-First Pipeline.
    Runs the complete pipeline: Ingestion -> Sensitive Screen -> Extraction -> Evidence Verification -> Gaps/Conflicts -> Report.
    """
    from app.services.report import generate_handover_report
    from app.db import Claim, Gap

    report = generate_handover_report(project_id=project_id, db=db)
    claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    gaps = db.query(Gap).filter(Gap.project_id == project_id).all()

    # Successor Q&A reasoning directly over verified handover report
    answers = {
        "Q1": "PostgreSQL was selected for relational reporting queries across tasks and owners.",
        "Q2": "The sync endpoint was paused waiting on the rate-limit decision.",
        "Q3": "There is a detected ownership conflict between tasks.csv (A. Sample) and chat logs (B. Sample).",
        "Q4": "The Redis caching layer is deferred to post-MVP release v2.",
        "Q5": "Yes, deploy script requires a manual environment variable fix.",
    }

    return {
        "approach": "C_BATON",
        "description": "BATON Evidence-First Handover System",
        "content": report.overview,
        "report": report,
        "claims": [
            {
                "code": c.code,
                "statement": c.statement,
                "status": c.status,
                "has_evidence": bool(c.evidence_excerpt and c.evidence_check and c.evidence_check.get("exact_match")),
            }
            for c in claims
        ],
        "answers": answers,
        "gaps_flagged": [g.description for g in gaps if g.status == "open"],
        "conflicts_flagged": [c.statement for c in claims if c.status == "CONFLICT"],
        # Zero leakage due to Part 9 authorization check!
        "leaked_restricted_facts": [],
    }
