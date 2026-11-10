import React, { useState } from 'react';
import { FileUp, Cpu, ShieldCheck, CheckCheck, ArrowRight, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export const HorizontalStoryFlow: React.FC = () => {
  const [activeGate, setActiveGate] = useState(0);

  const gates = [
    {
      step: '01',
      title: 'Ingestion & P2 Redaction',
      subtitle: 'Preserving Document Coordinates & Sanitizing PII',
      icon: FileUp,
      color: 'emerald',
      description:
        'Raw source documents (PDF, DOCX, TXT, CSV) are parsed chunk-by-chunk while preserving exact line numbers and page anchors. Prior to model invocation, regex filters mask API keys, tokens, and credentials with [REDACTED:type] to guarantee 0% permission leakage.',
      metrics: ['PDF / DOCX / TXT / CSV', 'Line & Page Anchors', '0% Secret Leakage'],
      codeSnippet: `// Sanitized Ingestion Chunk\n{\n  "source": "architecture_notes_v2.docx",\n  "location": "section: Architecture, para 3",\n  "content": "PostgreSQL selected for relational queries across tasks and owners.",\n  "secrets_redacted": 0\n}`,
    },
    {
      step: '02',
      title: 'Structured Claim Extraction',
      subtitle: '7 Rigid Claim Categories with Verbatim Quotes',
      icon: Cpu,
      color: 'teal',
      description:
        'Google Gemini 2.0 Flash extracts project knowledge into 7 distinct schemas (decision, task, blocker, dependency, workaround, ownership, next_action). Every claim is strictly bound to an unedited quote directly from the source chunk.',
      metrics: ['7 Strict Schemas', 'Low Temperature (0.1)', 'Pydantic v2 Validated'],
      codeSnippet: `// Extracted Claim Draft\n{\n  "code": "C-021",\n  "type": "blocker",\n  "statement": "Sync endpoint paused waiting on rate-limit decision",\n  "confidence": "medium",\n  "evidence_excerpt": "Sync work stopped here; waiting on the rate-limit decision."\n}`,
    },
    {
      step: '03',
      title: 'Two-Tier Evidence Verification',
      subtitle: 'RapidFuzz Distance + Gemini Entailment Check',
      icon: ShieldCheck,
      color: 'cyan',
      description:
        'The core differentiator: Tier 1 executes fuzzy string matching (ratio >= 0.90) to ensure the excerpt exists in the document chunk. Tier 2 performs semantic entailment check (supports | partial | no). Unsupported claims are immediately downgraded to UNSUPPORTED. Zero claims are auto-verified.',
      metrics: ['RapidFuzz >= 90%', 'Semantic Entailment', 'Zero Auto-VERIFIED'],
      codeSnippet: `// Evidence Verification Result\n{\n  "exact_match": true,\n  "match_ratio": 0.96,\n  "semantic": "supports",\n  "status": "NEEDS_REVIEW" // Awaiting human review\n}`,
    },
    {
      step: '04',
      title: 'Human Review & Gatekeeper',
      subtitle: 'Reviewer Ledger, Gap Resolution & BCI Handover',
      icon: CheckCheck,
      color: 'purple',
      description:
        'Humans decide; AI only proposes. Reviewers verify, edit, or reject claims with an immutable audit trail. Knowledge gaps and contradictions are resolved with successor assignments. Once unreviewed critical blockers hit 0, the official Handover Report is unlocked.',
      metrics: ['Immutable Audit Trail', 'BCI Formula Verified', 'Approval Gatekeeper'],
      codeSnippet: `// Official Handover Payload\n{\n  "status": "OFFICIALLY APPROVED",\n  "claims_verified": 27,\n  "gaps_resolved": 4,\n  "bci_score": "64.0 / 100",\n  "handover_ready": true\n}`,
    },
  ];

  return (
    <section className="py-16 border-y border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 relative transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-700 dark:text-emerald-400">
            <Layers className="w-3.5 h-3.5" />
            <span>The 4-Gate Handover Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            How BATON Guarantees Evidentiary Truth
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            From raw, unorganized company documents to a verified handover dossier in four audited gates.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {gates.map((g, idx) => {
            const Icon = g.icon;
            const isSelected = activeGate === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveGate(idx)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-50 dark:bg-slate-900 border-emerald-500 shadow-md dark:shadow-lg dark:shadow-emerald-500/10'
                    : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                    GATE {g.step}
                  </span>
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                  {g.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Active Gate Detailed Showcase */}
        {(() => {
          const current = gates[activeGate];
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 rounded-3xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                    GATE {current.step}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {current.subtitle}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                  {current.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                  {current.description}
                </p>

                {/* Key Metrics */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {current.metrics.map((m, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-700 dark:text-emerald-300 shadow-sm"
                    >
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Code / Payload Inspector */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs shadow-inner text-slate-100">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 font-mono text-slate-300">gate_{current.step}_telemetry.json</span>
                    </div>
                    <span>PARITY CHECK: PASS</span>
                  </div>
                  <pre className="mt-3 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                    {current.codeSnippet}
                  </pre>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
};
