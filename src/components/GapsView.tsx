import React from 'react';
import { KnowledgeGap, Claim } from '../types/baton';
import { HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, ShieldAlert, Sparkles } from 'lucide-react';

interface GapsViewProps {
  gaps: KnowledgeGap[];
  claims: Claim[];
  onOpenResolveModal: (gap: KnowledgeGap) => void;
  onReviewClaim: (claim: Claim) => void;
}

export const GapsView: React.FC<GapsViewProps> = ({
  gaps,
  claims,
  onOpenResolveModal,
  onReviewClaim,
}) => {
  const openGaps = gaps.filter((g) => g.status === 'open');
  const resolvedGaps = gaps.filter((g) => g.status === 'resolved');
  const conflictClaims = claims.filter((c) => c.status === 'CONFLICT');

  return (
    <div className="space-y-8 text-left transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
              Autonomous Gap & Conflict Detection
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Knowledge Gaps & Contradiction Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Surfaces missing decisions, orphaned tasks, and cross-source contradictory ownership claims.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
            {openGaps.length} Open Gaps
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold">
            {resolvedGaps.length} Resolved
          </span>
        </div>
      </div>

      {/* Contradiction / Conflict Matrix Section */}
      {conflictClaims.length > 0 && (
        <div className="p-6 rounded-3xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Detected Cross-Source Contradictions ({conflictClaims.length} Claims)
              </h3>
              <p className="text-xs text-orange-950 dark:text-orange-200/80">
                Rule-based ownership and decision auditor flagged competing statements across source files.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conflictClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-orange-300 dark:border-orange-500/40 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                    {claim.code}
                  </span>
                  <span className="text-[11px] font-mono text-orange-700 dark:text-orange-400 font-bold">
                    CONFLICT FLAG
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  "{claim.statement}"
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1 border border-slate-200 dark:border-slate-800">
                  <div>Source: <span className="text-slate-800 dark:text-slate-200 font-medium">{claim.source_name}</span></div>
                  <div>Reported Owner: <span className="text-emerald-700 dark:text-emerald-300 font-bold">{claim.owner}</span></div>
                </div>

                <button
                  onClick={() => onReviewClaim(claim)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-slate-950 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-500 text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  Resolve Contradiction in Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Knowledge Gaps */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Active Knowledge Gaps ({openGaps.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openGaps.map((gap) => (
            <div
              key={gap.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 uppercase">
                    {gap.kind.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    STATUS: OPEN
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {gap.description}
                </p>

                {/* Follow-up question box */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-950/80 border border-amber-200 dark:border-amber-500/20 space-y-1">
                  <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                    High-Leverage Successor Question
                  </div>
                  <p className="text-xs text-slate-900 dark:text-slate-200 font-semibold leading-relaxed">
                    "{gap.follow_up_question}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenResolveModal(gap)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-slate-950 text-slate-800 dark:bg-slate-800 dark:hover:bg-emerald-500 text-slate-200 text-xs font-semibold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provide Human Explanation & Owner</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resolved Knowledge Gaps */}
      {resolvedGaps.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-300 font-display flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Resolved Gaps ({resolvedGaps.length})
          </h3>

          <div className="space-y-3">
            {resolvedGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs shadow-sm"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                    {gap.kind.replace('_', ' ')} · RESOLVED
                  </span>
                  <span className="text-slate-500">
                    By {gap.resolved_by || 'Reviewer'}
                  </span>
                </div>

                <div className="text-slate-900 dark:text-slate-200 font-semibold">
                  {gap.resolution_note}
                </div>

                {gap.owner && (
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    Successor Assigned: <strong className="text-emerald-700 dark:text-emerald-300">{gap.owner}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
