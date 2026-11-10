import React from 'react';
import { ProjectDashboardMetrics } from '../types/baton';
import { TiltCard } from './TiltCard';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  HelpCircle,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

interface DashboardViewProps {
  metrics: ProjectDashboardMetrics;
  onNavigate: (tab: string) => void;
  onApproveHandover?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ metrics, onNavigate }) => {
  const verifiedPercentage = Math.round((metrics.claims_verified / metrics.claims_total) * 100);
  const gapPercentage = Math.round((metrics.gaps_resolved / metrics.gaps_total) * 100);

  return (
    <div className="space-y-8 text-left transition-colors">
      {/* Top Banner: Project Workspace Info */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              Workspace Active
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ID: {metrics.project_id.slice(0, 8)}...
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {metrics.project_name} Handover Workspace
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300 pt-1 font-mono">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Departing:</span>
              <span className="text-amber-700 dark:text-amber-300 font-semibold">{metrics.departing_member}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden sm:block" />
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Successor:</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{metrics.successor}</span>
            </div>
          </div>
        </div>

        {/* Readiness Gauge */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${verifiedPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold font-mono text-slate-900 dark:text-white">
              {verifiedPercentage}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">Project Health</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-display">
              {metrics.project_health}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {metrics.claims_verified}/{metrics.claims_total} claims verified
            </div>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TiltCard maxTilt={6} className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono mb-2">
            <span>Verified Claims</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {metrics.claims_verified}{' '}
            <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">/ {metrics.claims_total}</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${verifiedPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            66.7% backed by verbatim source quotes
          </p>
        </TiltCard>

        <TiltCard maxTilt={6} className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono mb-2">
            <span>Knowledge Gaps</span>
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {metrics.gaps_resolved}{' '}
            <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">/ {metrics.gaps_total}</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${gapPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            2 open questions require successor triage
          </p>
        </TiltCard>

        <TiltCard maxTilt={6} className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono mb-2">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {metrics.approvals_pending}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
            <span>Human review required to certify</span>
          </div>
        </TiltCard>

        <TiltCard maxTilt={6} className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono mb-2">
            <span>Pending Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {metrics.pending_tasks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-4">
            Catalogued from tasks.csv & sprint logs
          </div>
        </TiltCard>
      </div>

      {/* Two Column Layout: Needs Attention Checklist + Quick Action Relay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Needs Attention List */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Needs Immediate Attention ({metrics.needs_attention.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('gaps')}
              className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
            >
              Resolve Gaps <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {metrics.needs_attention.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
                  ALERT #{idx + 1}
                </span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow Steps & Quick Navigation */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Handover Progression Workflow
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete the audited gates before producing the certified Handover Report.
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <div
                onClick={() => onNavigate('sources')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-300">1. Ingest & Screen Documents (6)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Done ✓</span>
              </div>

              <div
                onClick={() => onNavigate('claims')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-300">2. Review Evidentiary Ledger</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">3 Pending</span>
              </div>

              <div
                onClick={() => onNavigate('gaps')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-300">3. Resolve Gaps & Conflicts</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">2 Open</span>
              </div>

              <div
                onClick={() => onNavigate('report')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-300">4. Approve Official Report</span>
                <span className="text-slate-400 dark:text-slate-500">Draft Status</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('claims')}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            Review Next Claim <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
