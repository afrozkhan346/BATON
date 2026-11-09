import json
import os
from typing import Dict, Any, List

from batonbench.bci import bci

DATASET_DIR = os.path.join(os.path.dirname(__file__), "dataset", "inventory_service")


def load_ground_truth() -> Dict[str, Any]:
    gt_path = os.path.join(DATASET_DIR, "ground_truth.json")
    with open(gt_path, "r", encoding="utf-8") as f:
        return json.load(f)


def score_approach(approach_output: Dict[str, Any], ground_truth: Dict[str, Any]) -> Dict[str, Any]:
    """Scores an approach against ground truth across all 7 evaluation dimensions."""
    expected_facts = ground_truth["expected_facts"]
    known_gaps = ground_truth["known_gaps"]
    known_conflicts = ground_truth["known_conflicts"]
    ownership_items = ground_truth["ownership_items"]
    restricted_facts = ground_truth["restricted_facts"]
    questions = ground_truth["successor_questions"]

    content = (approach_output.get("content") or "").lower()
    answers = approach_output.get("answers", {})
    claims = approach_output.get("claims", [])
    gaps_flagged = [g.lower() for g in approach_output.get("gaps_flagged", [])]
    conflicts_flagged = [c.lower() for c in approach_output.get("conflicts_flagged", [])]
    leaked = approach_output.get("leaked_restricted_facts", [])

    # 1. Knowledge Coverage (KC / K)
    matched_facts = 0
    for fact in expected_facts:
        f_keywords = [w.lower() for w in fact["text"].split() if len(w) > 4]
        # Check if fact appears in content or answers
        fact_found = any(kw in content for kw in f_keywords[:3]) or any(
            any(kw in ans.lower() for kw in f_keywords[:3]) for ans in answers.values()
        )
        if fact_found:
            matched_facts += 1

    kc = round((matched_facts / len(expected_facts)) * 100, 2) if expected_facts else 0.0

    # 2. Evidence Precision (EP / E)
    if claims:
        supported_claims = sum(1 for c in claims if c.get("has_evidence", False))
        ep = round((supported_claims / len(claims)) * 100, 2)
    else:
        ep = 0.0

    # 3. Gap Detection Recall (GDR / G)
    matched_gaps = 0
    for g in known_gaps:
        g_words = [w.lower() for w in g["text"].split() if len(w) > 4]
        if any(any(gw in flagged for gw in g_words[:2]) for flagged in gaps_flagged):
            matched_gaps += 1

    gdr = round((matched_gaps / len(known_gaps)) * 100, 2) if known_gaps else 0.0

    # 4. Conflict Detection Recall (CDR / C)
    matched_conflicts = 0
    for conf in known_conflicts:
        c_words = [w.lower() for w in conf["text"].split() if len(w) > 4]
        if any(any(cw in flagged for cw in c_words[:2]) for flagged in conflicts_flagged):
            matched_conflicts += 1

    cdr = round((matched_conflicts / len(known_conflicts)) * 100, 2) if known_conflicts else 0.0

    # 5. Permission Leakage Rate (PLR)
    leaked_count = sum(1 for rf in restricted_facts if any(rf["text"] in lk for lk in leaked))
    plr = round((leaked_count / len(restricted_facts)) * 100, 2) if restricted_facts else 0.0
    has_critical_leak = (plr > 0)

    # 6. Successor Comprehension (SC)
    correct_answers = 0
    for q in questions:
        qid = q["id"]
        ans = answers.get(qid, "").lower()
        exp = q["expected_answer"].lower()
        exp_words = [w for w in exp.split() if len(w) > 4]
        if any(w in ans for w in exp_words[:2]):
            correct_answers += 1

    sc = round((correct_answers / len(questions)) * 100, 2) if questions else 0.0

    # 7. Ownership Continuity (O)
    assigned_ownership = 0
    for oi in ownership_items:
        item_words = oi["item"].lower().split()
        if any(all(w in ans.lower() for w in item_words) for ans in answers.values()) or any(
            all(w in c.lower() for w in item_words) for c in conflicts_flagged
        ):
            assigned_ownership += 1

    o_score = round((assigned_ownership / len(ownership_items)) * 100, 2) if ownership_items else 0.0

    # Calculate BCI
    bci_result = bci(
        K=kc,
        E=ep,
        G=gdr,
        O=o_score,
        C=cdr,
        plr_critical_leak=has_critical_leak,
    )

    return {
        "approach": approach_output["approach"],
        "description": approach_output.get("description", ""),
        "KC": kc,
        "EP": ep if claims and approach_output["approach"] == "C_BATON" else "N/A",
        "GDR": gdr,
        "CDR": cdr,
        "PLR": plr,
        "SC": sc,
        "O": o_score,
        "BCI": bci_result["bci"],
        "status": bci_result["status"],
    }
