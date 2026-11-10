import React from 'react';
import { Claim, KnowledgeGap, ProjectDashboardMetrics } from '../types/baton';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Printer,
  Sparkles,
  Lock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HandoverReportViewProps {
  metrics: ProjectDashboardMetrics;
  claims: Claim[];
  gaps: KnowledgeGap[];
  isApproved: boolean;
  onApprove: () => void;
}

export const HandoverReportView: React.FC<HandoverReportViewProps> = ({
  metrics,
  claims,
  gaps,
  isApproved,
  onApprove,
}) => {
  const verifiedClaims = claims.filter((c) => c.status === 'VERIFIED');
  const uncertainClaims = claims.filter((c) => c.status !== 'VERIFIED' && c.status !== 'REJECTED');
  const openGaps = gaps.filter((g) => g.status === 'open');

  const handleApproveWithCelebration = () => {
    onApprove();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
      });
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto transition-colors">
      {/* Top Banner & Approval Control */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                isApproved
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40'
              }`}
            >
              {isApproved ? 'OFFICIALLY APPROVED' : 'DRAFT · AWAITING APPROVAL'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              CodeFrontier Handover Specification
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {metrics.project_name} Official Handover Dossier
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono">
            Prepared by <span className="text-slate-900 dark:text-slate-200 font-semibold">{metrics.departing_member}</span> for successor{' '}
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{metrics.successor}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            aria-label="Print or export PDF report"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-mono font-semibold transition-colors flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          {!isApproved ? (
            <button
              onClick={handleApproveWithCelebration}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Formally Approve Handover</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-mono text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Certified by Rushikesh Bobade</span>
            </div>
          )}
        </div>
      </div>

      {/* Dossier Document Container */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-10 shadow-sm dark:shadow-2xl">
        {/* Executive Overview */}
        <div className="space-y-3 pb-8 border-b border-slate-200 dark:border-slate-800/80">
          <h3 className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            1. Executive Overview
          </h3>
          <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed">
            The <strong>{metrics.project_name}</strong> tracks multi-warehouse inventory updates and stock reallocations. Core APIs are live in staging, with database schemas validated on PostgreSQL. The critical sync endpoint has been paused awaiting rate-limiting policy and successor ownership. All secret credentials have undergone P2 screening (0% permission leakage).
          </p>
        </div>

        {/* Section 2: What is Known (VERIFIED Only) */}
        <div className="space-y-4 pb-8 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              2. What is Known (Verified Ground Truth - {verifiedClaims.length} Claims)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Only claims with human-verified source quotes
            </span>
          </div>

          <div className="space-y-3">
            {verifiedClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-500/30 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{claim.code}</span>
                    <span className="text-slate-500 uppercase tracking-wider">[{claim.type}]</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Source: {claim.source_name} ({claim.location})
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  "{claim.statement}"
                </p>

                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-xs font-mono text-emerald-950 dark:text-emerald-300 border-l-2 border-emerald-500">
                  Verbatim: "{claim.evidence_excerpt}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: What Remains Uncertain */}
        <div className="space-y-4 pb-8 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              3. What Remains Uncertain ({uncertainClaims.length} Items)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Needs review, unsupported, or contradictory
            </span>
          </div>

          <div className="space-y-3">
            {uncertainClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{claim.code}</span>
                    <span className="text-slate-500 uppercase tracking-wider">[{claim.type}]</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      claim.status === 'CONFLICT'
                        ? 'bg-orange-500/15 text-orange-800 dark:text-orange-400'
                        : claim.status === 'UNSUPPORTED'
                        ? 'bg-rose-500/15 text-rose-800 dark:text-rose-400'
                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                    }`}
                  >
                    STATUS: {claim.status}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  "{claim.statement}"
                </p>

                <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                  Reason: {claim.evidence_check.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: What Needs Attention */}
        <div className="space-y-4 pb-8 border-b border-slate-200 dark:border-slate-800/80">
          <h3 className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            4. What Needs Attention (Open Knowledge Gaps - {openGaps.length} Items)
          </h3>

          <div className="space-y-3">
            {openGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-mono text-rose-800 dark:text-rose-300 font-bold">
                  <span>GAP: {gap.kind.toUpperCase()}</span>
                  <span>STATUS: OPEN</span>
                </div>
                <p className="text-sm text-slate-900 dark:text-slate-200 font-semibold">
                  {gap.description}
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 text-xs font-mono text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-800">
                  Successor Follow-up Question: "{gap.follow_up_question}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Next Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            5. Priority Next Actions for Successor ({metrics.successor})
          </h3>

          <div className="space-y-2">
            {[
              'Assign designated code owner to sync endpoint and resume rate-limit implementation',
              'Draft and commit Architectural Decision Record (ADR) for rate-limiting algorithm',
              'Resolve Auth module code owner contradiction between tasks.csv and triage chat',
              'Configure CI workflow for deploy.sh PORT_OVERRIDE environment variable',
              'Run BatonBench suite to verify BCI continuity score before deployment',
            ].map((action, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-mono shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {i + 1}
                </span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
