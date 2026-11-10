import React, { useState } from 'react';
import { Claim, ClaimStatus, ClaimType } from '../types/baton';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Edit3,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface ClaimsLedgerViewProps {
  claims: Claim[];
  onReviewClaim: (claim: Claim) => void;
}

export const ClaimsLedgerView: React.FC<ClaimsLedgerViewProps> = ({ claims, onReviewClaim }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClaims = claims.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesSearch =
      c.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.source_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.evidence_excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> VERIFIED
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> NEEDS REVIEW
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> CONFLICT
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> UNSUPPORTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left transition-colors">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              Two-Tier Evidentiary Ledger
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Claim Ledger ({filteredClaims.length} of {claims.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Every statement is linked to an exact source quote. Nothing is ever auto-verified.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims, quotes, files..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 shadow-sm">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'VERIFIED', 'NEEDS_REVIEW', 'CONFLICT', 'UNSUPPORTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">All Types (7)</option>
            <option value="decision">Decision</option>
            <option value="task">Task</option>
            <option value="blocker">Blocker</option>
            <option value="dependency">Dependency</option>
            <option value="workaround">Workaround</option>
            <option value="ownership">Ownership</option>
            <option value="next_action">Next Action</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm shadow-sm">
            No claims matched your filter criteria.
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className={`p-6 rounded-3xl border transition-all duration-200 space-y-4 shadow-sm ${
                claim.status === 'VERIFIED'
                  ? 'bg-white dark:bg-slate-900/70 border-emerald-500/40'
                  : claim.status === 'CONFLICT'
                  ? 'bg-white dark:bg-slate-900/70 border-orange-500/40'
                  : claim.status === 'UNSUPPORTED'
                  ? 'bg-white dark:bg-slate-900/70 border-rose-500/40'
                  : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Top Row: Code, Type, Status & Review Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                    {claim.code}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                    {claim.type}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                    Confidence: {claim.confidence.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(claim.status)}

                  <button
                    onClick={() => onReviewClaim(claim)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-emerald-500 text-slate-800 dark:text-slate-200 text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Review Audit</span>
                  </button>
                </div>
              </div>

              {/* Statement */}
              <div>
                <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  "{claim.statement}"
                </p>
                {claim.owner && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                    Owner: <span className="text-emerald-700 dark:text-emerald-300 font-bold">{claim.owner}</span>
                  </div>
                )}
              </div>

              {/* Verbatim Source Excerpt Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verbatim Source Evidence:
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {claim.source_name} ({claim.location})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-slate-900/60 border-l-2 border-emerald-500 text-xs font-mono text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
                  "{claim.evidence_excerpt || 'No source quotation linked'}"
                </div>

                {/* Evidence Check Results */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <span>
                      String Match:{' '}
                      <strong className="text-slate-900 dark:text-slate-200">
                        {claim.evidence_check.exact_match
                          ? 'Exact (100%)'
                          : `Fuzzy Ratio ${Math.round((claim.evidence_check.match_ratio ?? 0) * 100)}%`}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Semantic Evaluation:{' '}
                      <strong
                        className={
                          claim.evidence_check.semantic === 'supports'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : claim.evidence_check.semantic === 'partial'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }
                      >
                        {claim.evidence_check.semantic.toUpperCase()}
                      </strong>
                    </span>
                  </div>

                  <span className="text-slate-500 italic truncate max-w-sm">
                    {claim.evidence_check.note}
                  </span>
                </div>
              </div>

              {/* Conflict indicator (if any) */}
              {claim.conflict_with && claim.conflict_with.length > 0 && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 flex items-center justify-between text-xs text-orange-900 dark:text-orange-300 font-mono">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Contradiction detected with Claim {claim.conflict_with.join(', ')}</span>
                  </div>
                  <span className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold underline cursor-pointer">
                    Inspect Conflict Matrix →
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
