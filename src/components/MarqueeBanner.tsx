import React from 'react';
import { ShieldCheck, CheckCircle2, Cpu, Zap, Lock, Sparkles, Scale } from 'lucide-react';

export const MarqueeBanner: React.FC = () => {
  const items = [
    { icon: ShieldCheck, text: "Evidence-First Verification", highlight: "Zero Auto-Verify" },
    { icon: Cpu, text: "Two-Tier Engine", highlight: "RapidFuzz 90%+ & Gemini 2.0 Flash" },
    { icon: Scale, text: "Baton Continuity Index", highlight: "BCI 64.0 / 100 Benchmark" },
    { icon: Lock, text: "P2 Security Screening", highlight: "0.0% Permission Leakage" },
    { icon: CheckCircle2, text: "Successor Comprehension", highlight: "100% BatonBench Target" },
    { icon: Zap, text: "FastAPI + Pydantic v2", highlight: "Strict Schema Parity" },
    { icon: Sparkles, text: "Team WELCOME", highlight: "Rushikesh Bobade & Afroz Khan" },
  ];

  return (
    <div className="relative w-full overflow-hidden border-y border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-950/60 py-3 backdrop-blur-md select-none transition-colors">
      {/* Edge Gradients */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 dark:from-[#07090e] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 dark:from-[#07090e] to-transparent z-10" />

      <div className="flex w-max animate-marquee space-x-8">
        {[...items, ...items].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center space-x-2.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{item.text}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">{item.highlight}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
