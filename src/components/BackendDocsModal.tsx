import React, { useState } from 'react';
import { X, Copy, Check, Server, Shield, Database, Cpu, Terminal, ArrowRight, ExternalLink } from 'lucide-react';

interface BackendDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
}

export const BackendDocsModal: React.FC<BackendDocsModalProps> = ({ isOpen, onClose, apiBaseUrl }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'requirements' | 'architecture'>('endpoints');

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/health',
      tag: 'System',
      desc: 'Liveness check returning database status and active LLM provider (Gemini/Groq).',
      sampleResponse: `{\n  "status": "healthy",\n  "version": "1.0.0",\n  "database": "connected",\n  "llm_provider": "gemini"\n}`,
    },
    {
      method: 'POST',
      path: '/api/v1/projects',
      tag: 'Projects',
      desc: 'Creates a new project handover workspace with departing member and successor.',
      body: `{\n  "name": "Inventory Service",\n  "departing_member": "A. Sample",\n  "successor": "B. Sample"\n}`,
      sampleResponse: `{\n  "id": "e4b6d812-78d1-4b72-a4f5-5192083bc701",\n  "name": "Inventory Service",\n  "departing_member": "A. Sample",\n  "successor": "B. Sample",\n  "created_at": "2026-11-09T14:00:00Z"\n}`,
    },
    {
      method: 'GET',
      path: '/api/v1/projects/{id}/dashboard',
      tag: 'Projects',
      desc: 'Primary dashboard telemetry: verified counts, gap status, pending approvals, and urgent blockers.',
      sampleResponse: `{\n  "claims_verified": 18,\n  "claims_total": 27,\n  "gaps_resolved": 2,\n  "gaps_total": 4,\n  "approvals_pending": 3,\n  "pending_tasks": 14,\n  "needs_attention": [\n    "Sync endpoint has no owner",\n    "Database choice: no documented reason"\n  ],\n  "handover_ready": false\n}`,
    },
    {
      method: 'POST',
      path: '/api/v1/projects/{id}/sources',
      tag: 'Sources',
      desc: 'Multipart file upload for PDF, DOCX, TXT, or CSV with optional owner and P2 restricted flag.',
      curl: `curl -X POST "${apiBaseUrl}/api/v1/projects/{id}/sources" \\\n  -F "file=@architecture_notes_v2.docx" \\\n  -F "owner=A. Sample" \\\n  -F "restricted=false"`,
    },
    {
      method: 'POST',
      path: '/api/v1/projects/{id}/process',
      tag: 'Sources',
      desc: 'Triggers async AI extraction & evidence verification pipeline across all uploaded chunks.',
      sampleResponse: `{\n  "job_id": "job_01",\n  "status": "processing",\n  "message": "AI extraction and verification started"\n}`,
    },
    {
      method: 'GET',
      path: '/api/v1/projects/{id}/process/status',
      tag: 'Sources',
      desc: 'Poll progress percentage, chunks processed, claims extracted, and gaps identified.',
      sampleResponse: `{\n  "status": "completed",\n  "progress_pct": 100,\n  "chunks_processed": 32,\n  "claims_extracted": 27,\n  "gaps_found": 4,\n  "conflicts_found": 2\n}`,
    },
    {
      method: 'GET',
      path: '/api/v1/projects/{id}/claims',
      tag: 'Claims',
      desc: 'Query Claim Ledger with query param filters (?status=NEEDS_REVIEW&type=decision).',
      sampleResponse: `[\n  {\n    "id": "c-021-uuid",\n    "code": "C-021",\n    "type": "blocker",\n    "statement": "Sync endpoint paused before completion",\n    "confidence": "medium",\n    "status": "NEEDS_REVIEW",\n    "evidence_excerpt": "Sync work stopped here; waiting on the rate-limit decision.",\n    "evidence_check": {\n      "exact_match": true,\n      "semantic": "supports",\n      "note": "Excerpt explicitly states sync work stopped waiting on rate-limit decision"\n    }\n  }\n]`,
    },
    {
      method: 'POST',
      path: '/api/v1/claims/{id}/review',
      tag: 'Review',
      desc: 'Human decision (verify / edit / reject) with immutable review_events audit logging.',
      body: `{\n  "reviewer": "Rushikesh Bobade",\n  "action": "verify",\n  "statement": "Updated statement if editing",\n  "note": "Confirmed with sprint logs and PR history"\n}`,
    },
    {
      method: 'GET',
      path: '/api/v1/projects/{id}/gaps',
      tag: 'Gaps',
      desc: 'Retrieve detected knowledge gaps, open questions, and architectural missing links.',
      sampleResponse: `[\n  {\n    "id": "gap-01-uuid",\n    "kind": "missing_owner",\n    "description": "Sync endpoint left unfinished without designated owner.",\n    "follow_up_question": "Why was the sync endpoint paused, and who is responsible for resuming it?",\n    "status": "open"\n  }\n]`,
    },
    {
      method: 'POST',
      path: '/api/v1/gaps/{id}/resolve',
      tag: 'Gaps',
      desc: 'Resolves a knowledge gap with human explanation and assigns successor owner.',
      body: `{\n  "reviewer": "Rushikesh Bobade",\n  "resolution_note": "Sync endpoint resumed by B. Sample following rate-limit fix.",\n  "owner": "B. Sample"\n}`,
    },
    {
      method: 'GET',
      path: '/api/v1/projects/{id}/report',
      tag: 'Report',
      desc: 'Generates partitioned Handover Dossier: What is Known (VERIFIED only), What Remains Uncertain, and What Needs Attention.',
    },
    {
      method: 'POST',
      path: '/api/v1/projects/{id}/approve',
      tag: 'Report',
      desc: 'Formally seals and approves the handover. Only permitted when unreviewed critical claims = 0.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-docs-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <h2 id="backend-docs-title" className="text-lg font-bold text-white font-display flex items-center gap-2">
                BATON Backend Architecture & API Contract
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">v1.0.0</span>
              </h2>
              <p className="text-xs text-slate-400">
                FastAPI 1.0 (Python 3.13) · Uvicorn · Supabase / SQLite · Gemini 2.0 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close API specifications"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'endpoints'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            REST Endpoints ({endpoints.length})
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'requirements'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Frontend Integration Requirements
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'architecture'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Ingestion & Security Architecture
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-mono text-emerald-400 font-bold">API Base URL:</span>
                  <code className="bg-slate-900 px-2 py-1 rounded text-emerald-300 font-mono">
                    {apiBaseUrl}
                  </code>
                </div>
                <span className="text-slate-400 text-[11px]">
                  CORS enabled for localhost:3000 & Vercel
                </span>
              </div>

              <div className="grid gap-4">
                {endpoints.map((ep, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            ep.method === 'GET'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono font-bold text-slate-200">
                          {ep.path}
                        </code>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {ep.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {ep.desc}
                    </p>

                    {ep.body && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-slate-400">Request Body:</div>
                        <pre className="p-2.5 rounded bg-slate-900 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                          {ep.body}
                        </pre>
                      </div>
                    )}

                    {ep.sampleResponse && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-slate-400">Response (200 OK):</div>
                        <pre className="p-2.5 rounded bg-slate-900 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                          {ep.sampleResponse}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-3">
                <h3 className="text-sm font-bold text-cyan-400 font-display flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Frontend Integration Guardrails & State Machine
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span>
                      <strong className="text-white">Zero Auto-Verification Rule:</strong> The frontend must never show a claim as <code className="text-emerald-400">VERIFIED</code> unless approved by a human reviewer. Claims generated by AI start strictly in <code className="text-amber-400">NEEDS_REVIEW</code>, <code className="text-rose-400">UNSUPPORTED</code>, or <code className="text-orange-400">CONFLICT</code>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span>
                      <strong className="text-white">Evidentiary Verification Gatekeeper:</strong> The UI review modal must disable the "Verify" button whenever <code className="text-rose-300">evidence_check.semantic === 'no'</code> or when the verbatim quote is empty.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span>
                      <strong className="text-white">File Upload & Async Polling:</strong> Frontend submits files using <code className="text-cyan-300">FormData</code> with keys <code className="text-slate-300">file</code>, <code className="text-slate-300">owner</code>, and <code className="text-slate-300">restricted</code>. Then calls <code className="text-cyan-300">POST /process</code> and polls <code className="text-cyan-300">GET /process/status</code> every 1.5 seconds until <code className="text-emerald-300">status === "completed"</code>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">4.</span>
                    <span>
                      <strong className="text-white">Handover Report Partitioning:</strong> The final handover report must partition claims strictly into:
                      <br />• <em>"What is Known"</em>: ONLY claims with status <code className="text-emerald-400">VERIFIED</code>.
                      <br />• <em>"What Remains Uncertain"</em>: Claims in <code className="text-amber-400">NEEDS_REVIEW</code>, <code className="text-rose-400">UNSUPPORTED</code>, or <code className="text-orange-400">CONFLICT</code>.
                      <br />• <em>"What Needs Attention"</em>: Open knowledge gaps and missing owners.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">5.</span>
                    <span>
                      <strong className="text-white">Approval Gatekeeper:</strong> The "Approve Handover" button is locked until all critical items in "What Needs Attention" and "Needs Review" are reviewed or resolved.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Baton Continuity Index Calculation */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400 font-display">
                  Baton Continuity Index (BCI) Formula
                </h3>
                <div className="p-3 rounded bg-slate-900 font-mono text-xs text-emerald-300">
                  BCI = 0.30 · K + 0.25 · E + 0.20 · G + 0.15 · O + 0.10 · C
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                  <div>• <strong>K</strong> = Knowledge Coverage (%)</div>
                  <div>• <strong>E</strong> = Evidence Precision (%)</div>
                  <div>• <strong>G</strong> = Gap Recall / Resolution (%)</div>
                  <div>• <strong>O</strong> = Ownership Continuity (%)</div>
                  <div>• <strong>C</strong> = Conflict Resolution (%)</div>
                  <div>• <strong>Security Gate</strong> = PLR must be 0.0% (else BLOCKED)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-purple-400 font-display flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Two-Tier Evidence Verification Engine
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike traditional RAG systems that merely hallucinate citations, BATON implements a strict two-tier verification layer:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-emerald-400 font-mono">Tier 1: RapidFuzz Fuzzy String Match</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Computes normalized string distance (ratio ≥ 0.90) between <code className="text-slate-300">evidence_excerpt</code> and the source document text chunk. If missing, claim is immediately marked <code className="text-rose-400">UNSUPPORTED</code>.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-cyan-400 font-mono">Tier 2: LLM Semantic Entailment</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Gemini 2.0 Flash assesses: <em>"Does this excerpt logically substantiate this claim? (supports | partial | no)"</em>. A <code className="text-rose-400">no</code> downgrades claim to <code className="text-rose-400">UNSUPPORTED</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h3 className="text-sm font-bold text-amber-400 font-display flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  P2 Trust & Security Redaction Engine
                </h3>
                <p className="leading-relaxed">
                  Scans source documents for API keys (e.g. <code className="text-amber-300">sk-live...</code>, <code className="text-amber-300">AKIA...</code>, <code className="text-amber-300">ghp_...</code>), passwords, and PII. Masks matches with <code className="text-emerald-300">[REDACTED:secret]</code> prior to model ingestion to achieve <strong>0.0% Permission Leakage Rate (PLR)</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            FastAPI Backend: <code className="text-slate-400">cd backend && uvicorn app.main:app --port 8000</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
