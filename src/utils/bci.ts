import { BatonBenchScore, Claim } from '../types/baton';

/**
 * Calculates the Baton Continuity Index (BCI) score.
 * Formula: BCI = 0.30 * K + 0.25 * E + 0.20 * G + 0.15 * O + 0.10 * C
 * Security Gate: Any permission leakage (PLR > 0) sets status to BLOCKED.
 */
export function calculateBCI(params: {
  knowledge_coverage: number;
  evidence_precision: number;
  gap_recall: number;
  ownership_continuity: number;
  conflict_recall: number;
  permission_leakage: number;
  successor_comprehension?: number;
}): BatonBenchScore {
  const K = Math.max(0, Math.min(100, params.knowledge_coverage));
  const E = Math.max(0, Math.min(100, params.evidence_precision));
  const G = Math.max(0, Math.min(100, params.gap_recall));
  const O = Math.max(0, Math.min(100, params.ownership_continuity));
  const C = Math.max(0, Math.min(100, params.conflict_recall));
  const PLR = params.permission_leakage;

  const rawBci = (0.30 * K) + (0.25 * E) + (0.20 * G) + (0.15 * O) + (0.10 * C);
  const roundedBci = Math.round(rawBci * 10) / 10;

  // Security gate: Any permission leakage marks the run as BLOCKED
  const status = PLR > 0 ? 'BLOCKED' : 'OK';

  return {
    knowledge_coverage: K,
    evidence_precision: E,
    gap_recall: G,
    ownership_continuity: O,
    conflict_recall: C,
    permission_leakage: PLR,
    successor_comprehension: params.successor_comprehension ?? 100,
    bci_score: roundedBci,
    status,
  };
}

/**
 * Validates whether a claim meets the strict evidentiary standards to be transitioned
 * to 'VERIFIED'. Adheres to the BATON core differentiator:
 * 1. Must have a non-empty verbatim source excerpt.
 * 2. RapidFuzz string match / exact match must be valid.
 * 3. Semantic check must NOT be 'no'.
 */
export function canVerifyClaim(claim: Partial<Claim>): { allowed: boolean; reason?: string } {
  if (!claim.evidence_excerpt || claim.evidence_excerpt.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Rejected: No verbatim evidence excerpt provided from source document.',
    };
  }

  if (claim.evidence_check) {
    if (claim.evidence_check.semantic === 'no') {
      return {
        allowed: false,
        reason: 'Rejected: Semantic evaluation indicates source excerpt contradicts or does not support the claim.',
      };
    }

    if (!claim.evidence_check.exact_match && (claim.evidence_check.match_ratio ?? 0) < 0.85) {
      return {
        allowed: false,
        reason: 'Rejected: Source excerpt failed fuzzy text verification against raw document chunk.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Computes dashboard completion and readiness indicators.
 */
export function computeHandoverReadiness(
  verifiedCount: number,
  totalClaims: number,
  openGapsCount: number,
  activeConflictsCount: number
): { ready: boolean; percentage: number; blockers: string[] } {
  const blockers: string[] = [];

  const unverified = totalClaims - verifiedCount;
  if (unverified > 0) {
    blockers.push(`${unverified} claim${unverified === 1 ? '' : 's'} awaiting human review`);
  }

  if (openGapsCount > 0) {
    blockers.push(`${openGapsCount} unresolved knowledge gap${openGapsCount === 1 ? '' : 's'}`);
  }

  if (activeConflictsCount > 0) {
    blockers.push(`${activeConflictsCount} contradictory statement${activeConflictsCount === 1 ? '' : 's'}`);
  }

  const claimRatio = totalClaims > 0 ? verifiedCount / totalClaims : 0;
  const gapPenalty = openGapsCount * 0.1;
  const conflictPenalty = activeConflictsCount * 0.15;
  const rawPct = Math.max(0, Math.min(100, Math.round((claimRatio * 100) - ((gapPenalty + conflictPenalty) * 100))));

  return {
    ready: blockers.length === 0,
    percentage: rawPct,
    blockers,
  };
}
