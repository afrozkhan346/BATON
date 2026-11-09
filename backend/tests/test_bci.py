import pytest
from batonbench.bci import bci


def test_bci_worked_example():
    """Proposal Figure 9 Worked Example:
    K=80, E=90, G=70, O=85, C=75
    Expected: 80.75
    """
    result = bci(K=80, E=90, G=70, O=85, C=75, plr_critical_leak=False)
    assert result["status"] == "OK"
    assert result["bci"] == 80.75
    assert result["breakdown"]["knowledge_coverage"] == 24.00
    assert result["breakdown"]["evidence_reliability"] == 22.50
    assert result["breakdown"]["gap_resolution"] == 14.00
    assert result["breakdown"]["ownership_continuity"] == 12.75
    assert result["breakdown"]["conflict_resolution"] == 7.50


def test_bci_security_gate_blocks():
    """Security Gate: If plr_critical_leak is True, status must be BLOCKED."""
    result = bci(K=100, E=100, G=100, O=100, C=100, plr_critical_leak=True)
    assert result["status"] == "BLOCKED"
    assert result["bci"] is None
