import React from 'react';
import { ThreeHeroCanvas } from './ThreeHeroCanvas';
import { MagneticButton } from './MagneticButton';
import { TiltCard } from './TiltCard';
import { ShieldCheck, ArrowRight, Sparkles, Terminal, FileCheck, Layers, GitBranch, Play } from 'lucide-react';

interface HeroSectionProps {
  onExplore: () => void;
  onOpenDocs: () => void;
  onOpenBenchmark: () => void;
  isDark: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onOpenDocs,
  onOpenBenchmark,
  isDark,
}) => {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] -z-10" />
      <div className="pointer-events-none absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Cinematic Typography & Narrative */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium shadow-inner shadow-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CodeFrontier Hackathon · Round 2</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-[1.1]">
              Don't Just Transfer Work.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
                Transfer Understanding.
              </span>
            </h1>

            {/* Problem & Solution Narrative */}
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
              Generic AI summarizers hallucinate, and traditional wiki handovers transfer flat task lists without the underlying blockers, architectural tradeoffs, or ownership shifts.
              <strong className="text-slate-900 dark:text-white font-semibold block mt-2">
                BATON reconstructs project reality into an Evidence-First Claim Ledger where every assertion is backed by a verbatim source excerpt and verified by human review.
              </strong>
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <MagneticButton
                onClick={onExplore}
                variant="primary"
                className="group text-sm px-6 py-3"
              >
                Launch Handover Studio
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>

              <MagneticButton
                onClick={onOpenDocs}
                variant="secondary"
                className="text-sm px-5 py-3"
              >
                <Terminal className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                Backend API Blueprint
              </MagneticButton>

              <button
                onClick={onOpenBenchmark}
                className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 underline underline-offset-4 transition-colors flex items-center gap-1.5 py-2 px-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                View BatonBench Results
              </button>
            </div>

            {/* Live Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">BCI Score</div>
                <div className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-0.5">
                  64.0 <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">/100</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-500/80 font-mono mt-0.5">Tested & Passed</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Knowledge Coverage</div>
                <div className="text-xl font-bold font-display text-cyan-600 dark:text-cyan-400 mt-0.5">
                  80.0%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">+20% vs Manual</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Permission Leakage</div>
                <div className="text-xl font-bold font-display text-emerald-700 dark:text-emerald-300 mt-0.5">
                  0.0%
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Zero Leak Target</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Comprehension</div>
                <div className="text-xl font-bold font-display text-purple-600 dark:text-purple-300 mt-0.5">
                  100%
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">Successor Clarity</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive WebGL Core & Floating Context Cards */}
          <div className="lg:col-span-5 relative">
            <TiltCard maxTilt={8} className="rounded-3xl glass-panel p-2 shadow-2xl">
              <div className="relative w-full h-[460px] rounded-2xl bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950/80 dark:via-slate-900/60 dark:to-slate-950/90 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col">
                {/* 3D WebGL Canvas */}
                <div className="w-full h-full relative">
                  <ThreeHeroCanvas isDark={isDark} />

                  {/* Overlaid UI Pills */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-emerald-500/30 backdrop-blur-md flex items-center gap-2 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        Evidence Neural Core
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 z-20">
                    <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 backdrop-blur-md text-[11px] font-mono text-cyan-700 dark:text-cyan-300 shadow-md">
                      Rotate 3D with cursor ↗
                    </div>
                  </div>

                  {/* Floating verification badge overlay */}
                  <div className="absolute bottom-4 left-4 z-20 max-w-[200px]">
                    <div className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 backdrop-blur-md text-left text-xs shadow-xl space-y-1">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Claim C-014</div>
                      <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        "PostgreSQL selected for relational reporting"
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verbatim Excerpt Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Floating Decorative Glow */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
