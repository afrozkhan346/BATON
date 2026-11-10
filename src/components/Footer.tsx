import React from 'react';
import { ShieldCheck, GitBranch, Github, Terminal, Heart, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenDocs: () => void;
  onOpenBenchmark: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDocs, onOpenBenchmark }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/80 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 text-xs py-12 transition-colors select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                B
              </div>
              <span className="font-display font-bold text-slate-900 dark:text-white text-base tracking-wider">
                BATON
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                · Evidence-First Knowledge Handover Platform
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs max-w-md">
              "Don't Just Transfer Work. Transfer Understanding." Built for CodeFrontier Hackathon Round 2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Branch: <strong>frontend-development</strong></span>
            </div>

            <button
              onClick={onOpenDocs}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>API Contract (v1)</span>
            </button>

            <button
              onClick={onOpenBenchmark}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Table 1 BCI Benchmark</span>
            </button>
          </div>
        </div>

        {/* Team WELCOME Credits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              Team Leader · Frontend & UI/UX
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Rushikesh Bobade
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Frontend Architecture, Award-Winning Motion & Two-Tier Handover Workflows
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold">
              Backend & AI Architecture
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Afroz Khan
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              FastAPI Pipeline, Claim Ingestion, BatonBench Synthetic Evaluation & BCI Engine
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-3">
          <div>
            Repository: <code className="text-slate-700 dark:text-slate-400">https://github.com/afrozkhan346/BATON.git</code>
          </div>
          <div>
            FastAPI Base: <code className="text-slate-700 dark:text-slate-400">http://localhost:8000/api/v1</code>
          </div>
        </div>
      </div>
    </footer>
  );
};
