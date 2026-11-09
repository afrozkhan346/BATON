from typing import Optional, Dict, Any


def bci(
    K: float,
    E: float,
    G: float,
    O: float,
    C: float,
    plr_critical_leak: bool = False,
) -> Dict[str, Any]:
    """Calculate Baton Continuity Index (BCI) as defined in Proposal Section 09.

    Formula:
      BCI = 0.30 * K + 0.25 * E + 0.20 * G + 0.15 * O + 0.10 * C

    Security Gate:
      Any critical permission leak (plr_critical_leak=True) immediately sets
      status to 'BLOCKED' and returns bci=None.
    """
    if plr_critical_leak:
        return {
            "status": "BLOCKED",
            "bci": None,
            "reason": "Security Gate Triggered: Sensitive/restricted entity leaked in handover.",
        }

    score = 0.30 * K + 0.25 * E + 0.20 * G + 0.15 * O + 0.10 * C
    return {
        "status": "OK",
        "bci": round(score, 2),
        "breakdown": {
            "knowledge_coverage": round(0.30 * K, 2),
            "evidence_reliability": round(0.25 * E, 2),
            "gap_resolution": round(0.20 * G, 2),
            "ownership_continuity": round(0.15 * O, 2),
            "conflict_resolution": round(0.10 * C, 2),
        },
    }
