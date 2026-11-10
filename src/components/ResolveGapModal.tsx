import React, { useState } from 'react';
import { KnowledgeGap } from '../types/baton';
import { CheckCircle2, X, HelpCircle, User, ShieldCheck } from 'lucide-react';

interface ResolveGapModalProps {
  gap: KnowledgeGap;
  reviewerName: string;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (gapId: string, resolutionNote: string, owner?: string) => void;
}

export const ResolveGapModal: React.FC<ResolveGapModalProps> = ({
  gap,
  reviewerName,
  isOpen,
  onClose,
  onResolve,
}) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [owner, setOwner] = useState(gap.owner || '');
  const [reviewer, setReviewer] = useState(reviewerName || 'Rushikesh Bobade');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;
    onResolve(gap.id, resolutionNote, owner.trim() ? owner : undefined);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-gap-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <HelpCircle className="w-4 h-4" />
            </span>
            <h2 id="resolve-gap-title" className="text-base font-bold text-slate-900 dark:text-white font-display">
              Resolve Knowledge Gap ({gap.kind})
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-slate-950/80 border border-amber-200 dark:border-slate-800 space-y-2">
            <div className="text-xs text-amber-800 dark:text-amber-400 font-mono font-bold uppercase tracking-wider">
              Follow-up Question for Successor
            </div>
            <p className="text-slate-900 dark:text-slate-200 font-semibold text-xs leading-relaxed">
              "{gap.follow_up_question}"
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
              Context: {gap.description}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Human Resolution & Explanation (Required)
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Sync endpoint resumed by B. Sample following upstream rate-limit token bucket rollout."
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Rule: Answers are never auto-filled by AI. Human reviewer explanation becomes official record.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Designated Owner (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. B. Sample"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Reviewer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!resolutionNote.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve Gap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
