import React, { useState } from 'react';
import { Claim, ClaimStatus } from '../types/baton';
import { canVerifyClaim } from '../utils/bci';
import { CheckCircle2, XCircle, AlertTriangle, Edit3, ShieldAlert, FileText, Sparkles, X, User } from 'lucide-react';

interface ReviewModalProps {
  claim: Claim;
  reviewerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: 'verify' | 'edit' | 'reject', updatedStatement?: string, note?: string) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  claim,
  reviewerName,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [action, setAction] = useState<'verify' | 'edit' | 'reject'>('verify');
  const [statement, setStatement] = useState(claim.statement);
  const [note, setNote] = useState('');
  const [reviewer, setReviewer] = useState(reviewerName || 'Rushikesh Bobade');

  if (!isOpen) return null;

  const verifyCheck = canVerifyClaim(claim);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'verify' && !verifyCheck.allowed) {
      return;
    }
    onSubmit(action, action === 'edit' ? statement : undefined, note);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
              {claim.code}
            </span>
            <h2 id="review-modal-title" className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Human Review & Evidentiary Audit
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Claim Statement Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
              <span className="uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400">
                Claim Type: {claim.type}
              </span>
              <span>Confidence: {claim.confidence.toUpperCase()}</span>
            </div>
            <p className="text-slate-900 dark:text-slate-100 font-semibold text-base leading-relaxed">
              "{claim.statement}"
            </p>
          </div>

          {/* Verbatim Source Evidence */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                <FileText className="w-3.5 h-3.5" />
                Verbatim Source Excerpt (Ground Truth)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {claim.source_name} ({claim.location})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border-l-2 border-emerald-500 text-emerald-950 dark:text-emerald-200 text-xs font-mono leading-relaxed">
              "{claim.evidence_excerpt || 'No source excerpt linked'}"
            </div>

            {/* Two-Tier Evidence Verification Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">Tier 1: RapidFuzz Match</div>
                <div className="flex items-center gap-1.5">
                  {claim.evidence_check.exact_match ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  )}
                  <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {claim.evidence_check.exact_match ? 'Exact Match (100%)' : `Fuzzy Ratio ${Math.round((claim.evidence_check.match_ratio ?? 0) * 100)}%`}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">Tier 2: LLM Semantic Evaluation</div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                      claim.evidence_check.semantic === 'supports'
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
                        : claim.evidence_check.semantic === 'partial'
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                        : 'bg-rose-500/15 text-rose-800 dark:text-rose-400'
                    }`}
                  >
                    {claim.evidence_check.semantic.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              Verification Note: {claim.evidence_check.note}
            </p>
          </div>

          {/* Form Actions */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Select Review Decision
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAction('verify')}
                  disabled={!verifyCheck.allowed}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    action === 'verify'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  } ${!verifyCheck.allowed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <CheckCircle2 className="w-5 h-5 mb-1.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-xs">Verify Claim</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Move to Verified</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('edit')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    action === 'edit'
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 ring-1 ring-cyan-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-5 h-5 mb-1.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-semibold text-xs">Edit Statement</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Refine claim wording</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    action === 'reject'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-300 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <XCircle className="w-5 h-5 mb-1.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold text-xs">Reject Claim</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Mark unverified</span>
                </button>
              </div>

              {!verifyCheck.allowed && action === 'verify' && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2 text-rose-800 dark:text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{verifyCheck.reason}</span>
                </div>
              )}
            </div>

            {/* Editable Statement input if action === 'edit' */}
            {action === 'edit' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Refined Statement
                </label>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-sans focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Reviewer Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Audit Log Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Cross-checked with architecture ADR #12"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Review History Audit Trail */}
            {claim.review_history && claim.review_history.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Audit History ({claim.review_history.length} event)
                </div>
                {claim.review_history.map((rev) => (
                  <div key={rev.id} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2 rounded border border-slate-200 dark:border-slate-800/80">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{rev.reviewer}</span> transitioned claim via{' '}
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{rev.action}</span>: "{rev.note}"
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={action === 'verify' && !verifyCheck.allowed}
                className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-md transition-all ${
                  action === 'verify'
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : action === 'edit'
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                } ${action === 'verify' && !verifyCheck.allowed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Confirm {action === 'verify' ? 'Verification' : action === 'edit' ? 'Edit' : 'Rejection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
