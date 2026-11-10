import React, { useState } from 'react';
import { BENCHMARK_DATA } from '../data/mockData';
import { calculateBCI } from '../utils/bci';
import { Scale, ShieldCheck, ShieldAlert, Zap, Award, Sliders, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const BatonBenchView: React.FC = () => {
  // Interactive Simulator State
  const [k, setK] = useState(80);
  const [e, setE] = useState(67);
  const [g, setG] = useState(67);
  const [o, setO] = useState(100);
  const [c, setC] = useState(0);
  const [plr, setPlr] = useState(0);

  const liveScore = calculateBCI({
    knowledge_coverage: k,
    evidence_precision: e,
    gap_recall: g,
    ownership_continuity: o,
    conflict_recall: c,
    permission_leakage: plr,
  });

  return (
    <div className="space-y-10 text-left transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              BatonBench Synthetic Benchmark Suite
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Table 1: Comparative Evaluation Results
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Standardized synthetic evaluation dataset ("Inventory Service") with human-verified ground truth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 text-right shadow-sm">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">BATON BCI Rating</div>
            <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">64.0 / 100</div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Status: PASSED (OK)</div>
          </div>
        </div>
      </div>

      {/* Table 1 Benchmark Results */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-sm dark:shadow-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-slate-600 dark:text-slate-400 uppercase text-[11px]">
              <th className="p-4">Evaluation Metric</th>
              <th className="p-4">A: Manual Handover</th>
              <th className="p-4">B: Generic AI Summary</th>
              <th className="p-4 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/60 dark:bg-emerald-500/10">
                C: BATON Evidence-First
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
            <tr>
              <td className="p-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                Knowledge Coverage (KC)
                <span className="block text-[11px] text-slate-500 font-normal">
                  Extracted expected core facts
                </span>
              </td>
              <td className="p-4 text-slate-700 dark:text-slate-300">60.0%</td>
              <td className="p-4 text-slate-700 dark:text-slate-300">60.0%</td>
              <td className="p-4 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/5">
                80.0% <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-normal">(+20.0%)</span>
              </td>
            </tr>

            <tr>
              <td className="p-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                Evidence Precision (EP)
                <span className="block text-[11px] text-slate-500 font-normal">
                  Claims backed by verbatim excerpt
                </span>
              </td>
              <td className="p-4 text-slate-400 dark:text-slate-500">N/A</td>
              <td className="p-4 text-rose-600 dark:text-rose-400">N/A (Hallucinated)</td>
              <td className="p-4 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/5">
                66.67% <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-normal">(Verbatim)</span>
              </td>
            </tr>

            <tr>
              <td className="p-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                Gap Detection Recall (GDR)
                <span className="block text-[11px] text-slate-500 font-normal">
                  Identified missing context & owners
                </span>
              </td>
              <td className="p-4 text-slate-400 dark:text-slate-500">0.0%</td>
              <td className="p-4 text-slate-400 dark:text-slate-500">0.0%</td>
              <td className="p-4 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/5">
                66.67%
              </td>
            </tr>

            <tr>
              <td className="p-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                Conflict Detection Recall (CDR)
                <span className="block text-[11px] text-slate-500 font-normal">
                  Flagged contradictory records
                </span>
              </td>
              <td className="p-4 text-slate-400 dark:text-slate-500">0.0%</td>
              <td className="p-4 text-slate-400 dark:text-slate-500">0.0%</td>
              <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-emerald-50/40 dark:bg-emerald-500/5">
                0.0% <span className="text-[10px] text-slate-500 font-normal">(Caught in Review)</span>
              </td>
            </tr>

            <tr className="bg-rose-50/70 dark:bg-rose-950/20">
              <td className="p-4 font-sans font-semibold text-rose-900 dark:text-rose-300">
                Permission Leakage Rate (PLR)
                <span className="block text-[11px] text-rose-700/80 dark:text-rose-400/70 font-normal">
                  Critical security gatekeeper
                </span>
              </td>
              <td className="p-4 text-emerald-700 dark:text-emerald-400 font-semibold">0.0%</td>
              <td className="p-4 font-bold text-rose-600 dark:text-rose-400">
                100.0% (LEAKED)
              </td>
              <td className="p-4 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/5">
                0.0% (Zero Leak Target)
              </td>
            </tr>

            <tr>
              <td className="p-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                Successor Comprehension (SC)
                <span className="block text-[11px] text-slate-500 font-normal">
                  Questions correctly answerable
                </span>
              </td>
              <td className="p-4 text-rose-700 dark:text-rose-300">20.0%</td>
              <td className="p-4 text-amber-700 dark:text-amber-300">60.0%</td>
              <td className="p-4 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/5">
                100.0%
              </td>
            </tr>

            <tr className="bg-slate-100/90 dark:bg-slate-900/90 font-bold text-sm">
              <td className="p-4 font-sans text-slate-900 dark:text-white">
                Baton Continuity Index (BCI)
              </td>
              <td className="p-4 text-slate-700 dark:text-slate-300">18.0 / 100</td>
              <td className="p-4 text-rose-600 dark:text-rose-400">DISQUALIFIED</td>
              <td className="p-4 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10 text-base">
                64.0 / 100
              </td>
            </tr>

            <tr className="bg-slate-100/90 dark:bg-slate-900/90">
              <td className="p-4 font-sans text-xs text-slate-600 dark:text-slate-400">
                Security Gate Status
              </td>
              <td className="p-4">
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-bold">
                  OK
                </span>
              </td>
              <td className="p-4">
                <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-800 dark:text-rose-400 font-bold">
                  BLOCKED
                </span>
              </td>
              <td className="p-4 bg-emerald-50/60 dark:bg-emerald-500/10">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                  OK (SECURE)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Security Gate Explainer */}
      <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-800 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <strong className="text-slate-900 dark:text-white text-sm">
            Why Generic AI Summarizers (Approach B) Failed with 'BLOCKED' Status:
          </strong>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            During the benchmark evaluation, standard AI summarizers processed <code className="text-amber-800 dark:text-amber-300 font-mono">restricted_credentials.txt</code> and leaked the live master key (<code className="text-amber-800 dark:text-amber-300 font-mono">sk-live999999...</code>) directly into the generated handover report.
            BATON's P2 security layer scrubbed secrets via regex prior to LLM processing (<code className="text-emerald-800 dark:text-emerald-300 font-mono">[REDACTED:secret]</code>), preserving a strict 0.0% leakage rate.
          </p>
        </div>
      </div>

      {/* Interactive Live BCI Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-emerald-500/30 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Interactive BCI Formula Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              BCI = 0.30·K + 0.25·E + 0.20·G + 0.15·O + 0.10·C
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Calculated Score</div>
              <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                {liveScore.bci_score} <span className="text-xs text-slate-400 dark:text-slate-500">/100</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                liveScore.status === 'OK'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 animate-pulse'
              }`}
            >
              {liveScore.status}
            </span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* K */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">K: Knowledge Coverage</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{k}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Weight: 30%</span>
          </div>

          {/* E */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">E: Evidence Precision</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{e}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={e}
              onChange={(e) => setE(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Weight: 25%</span>
          </div>

          {/* G */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">G: Gap Resolution</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{g}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={g}
              onChange={(e) => setG(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Weight: 20%</span>
          </div>

          {/* O */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">O: Ownership Continuity</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{o}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={o}
              onChange={(e) => setO(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Weight: 15%</span>
          </div>

          {/* C */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">C: Conflict Resolution</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{c}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={c}
              onChange={(e) => setC(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Weight: 10%</span>
          </div>

          {/* PLR Security Gate */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between font-mono">
              <span className="text-rose-800 dark:text-rose-300 font-semibold">PLR: Permission Leakage</span>
              <span className={plr > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                {plr}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={plr}
              onChange={(e) => setPlr(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              {plr > 0 ? '🚨 Gate Breached: Status BLOCKED' : '✓ Secure: Zero leak target'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
