import React from 'react';
import { ShieldCheck, GitBranch, Terminal, Sun, Moon, Cpu, Layers, FileCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenDocs: () => void;
  isLiveBackend: boolean;
  setIsLiveBackend: (live: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onOpenDocs,
  isLiveBackend,
  setIsLiveBackend,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Pulse' },
    { id: 'sources', label: 'Ingestion & PII' },
    { id: 'claims', label: 'Claim Ledger' },
    { id: 'gaps', label: 'Gaps & Conflicts' },
    { id: 'report', label: 'Handover Report' },
    { id: 'bench', label: 'BatonBench (BCI)' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/75 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg tracking-wider text-slate-900 dark:text-white">
                  BATON
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                Evidence-First Handover
              </p>
            </div>
          </div>

          {/* Active Git Branch Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <GitBranch className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">branch:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">frontend-development</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Action Icons & Toggles */}
        <div className="flex items-center gap-2.5">
          {/* Live vs Simulator Backend switch */}
          <button
            onClick={() => setIsLiveBackend(!isLiveBackend)}
            title={isLiveBackend ? "Connected to FastAPI localhost:8000" : "Running on Embedded State Engine"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono transition-colors shadow-sm cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveBackend ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-cyan-500 dark:bg-cyan-400'
              }`}
            />
            <span className="hidden sm:inline">
              {isLiveBackend ? 'FastAPI :8000' : 'Embedded Engine'}
            </span>
          </button>

          {/* API Contract Docs trigger */}
          <button
            onClick={onOpenDocs}
            aria-label="View API Contract and Backend Blueprint"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors shadow-sm cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">API Blueprint</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark/light theme"
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/90 overflow-x-auto gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeTab === item.id
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
