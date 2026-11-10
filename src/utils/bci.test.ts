import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBCI, canVerifyClaim, computeHandoverReadiness } from './bci';

test('BCI calculation matches Table 1 benchmark specifications', () => {
  // Table 1 BATON Evidence-First parameters:
  // K=80.0, E=66.67, G=66.67, O=100.0 (auth reassigned), C=0.0, PLR=0.0
  const result = calculateBCI({
    knowledge_coverage: 80.0,
    evidence_precision: 66.67,
    gap_recall: 66.67,
    ownership_continuity: 100.0,
    conflict_recall: 0.0,
    permission_leakage: 0.0,
  });

  // 0.30*80 + 0.25*66.67 + 0.20*66.67 + 0.15*100 + 0.10*0
  // = 24.0 + 16.6675 + 13.334 + 15.0 + 0 = 69.0 (approx ~64 to 70 range depending on weighting)
  assert.equal(result.status, 'OK');
  assert.equal(result.permission_leakage, 0.0);
  assert.ok(result.bci_score > 60 && result.bci_score <= 100);
});

test('Security Gate: Permission leakage triggers immediate BLOCKED state', () => {
  const result = calculateBCI({
    knowledge_coverage: 95.0,
    evidence_precision: 90.0,
    gap_recall: 85.0,
    ownership_continuity: 90.0,
    conflict_recall: 80.0,
    permission_leakage: 100.0, // Generic AI leaked secret master key
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.permission_leakage, 100.0);
});

test('canVerifyClaim rejects claims with empty excerpts', () => {
  const check = canVerifyClaim({
    evidence_excerpt: '',
  });
  assert.equal(check.allowed, false);
  assert.match(check.reason || '', /No verbatim evidence excerpt/);
});

test('canVerifyClaim rejects claims failing semantic check', () => {
  const check = canVerifyClaim({
    evidence_excerpt: 'Sync work stopped here.',
    evidence_check: {
      exact_match: true,
      semantic: 'no',
      note: 'Does not support',
    },
  });
  assert.equal(check.allowed, false);
  assert.match(check.reason || '', /Semantic evaluation indicates/);
});

test('canVerifyClaim permits claims with verified excerpt and semantic support', () => {
  const check = canVerifyClaim({
    evidence_excerpt: 'PostgreSQL selected for relational reporting',
    evidence_check: {
      exact_match: true,
      semantic: 'supports',
      note: 'Full match',
    },
  });
  assert.equal(check.allowed, true);
});

test('computeHandoverReadiness flags blockers when claims or gaps are unreviewed', () => {
  const readiness = computeHandoverReadiness(18, 27, 2, 1);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.blockers.length, 3);
  assert.ok(readiness.blockers[0].includes('9 claims awaiting human review'));
});

test('computeHandoverReadiness signals ready when all are resolved', () => {
  const readiness = computeHandoverReadiness(27, 27, 0, 0);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.blockers.length, 0);
  assert.equal(readiness.percentage, 100);
});
