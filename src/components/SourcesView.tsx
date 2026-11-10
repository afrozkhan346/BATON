import React, { useState } from 'react';
import { SourceDocument, ProcessStatus, User } from '../types/baton';
import {
  FileText,
  UploadCloud,
  Shield,
  FileCheck,
  Cpu,
  Lock,
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

interface SourcesViewProps {
  sources: SourceDocument[];
  onUploadFile: (file: File, restricted?: boolean) => void;
  onRunProcessing: () => void;
  processStatus: ProcessStatus;
  currentUser?: User | null;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  onUploadFile,
  onRunProcessing,
  processStatus,
  currentUser,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [restrictedMode, setRestrictedMode] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0], restrictedMode);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0], restrictedMode);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
      case 'docx':
        return <FileCode className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 text-left transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <UploadCloud className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              Multi-Format Source Ingestion & Screening
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Document Repository & P2 Security Layer
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Accepts PDF, DOCX, TXT, and CSV with chunk location preservation and automated secret scrubbing.
          </p>
        </div>

        <button
          onClick={onRunProcessing}
          disabled={processStatus.status === 'processing'}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {processStatus.status === 'processing' ? (
            <>
              <Cpu className="w-4 h-4 animate-spin text-slate-950" />
              <span>Running AI Extraction ({processStatus.progress_pct}%)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Trigger AI Processing Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Processing Progress Bar (if active or recently finished) */}
      {processStatus.status !== 'idle' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 animate-spin" />
              AI Extraction & Two-Tier Evidence Verifier
            </span>
            <span className="text-slate-800 dark:text-slate-300 font-bold">{processStatus.progress_pct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${processStatus.progress_pct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
            <div>Chunks Processed: <span className="text-emerald-700 dark:text-emerald-300 font-bold">{processStatus.chunks_processed}</span></div>
            <div>Claims Extracted: <span className="text-cyan-700 dark:text-cyan-300 font-bold">{processStatus.claims_extracted}</span></div>
            <div>Gaps Found: <span className="text-amber-700 dark:text-amber-300 font-bold">{processStatus.gaps_found}</span></div>
            <div>Conflicts: <span className="text-rose-700 dark:text-rose-300 font-bold">{processStatus.conflicts_found}</span></div>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative p-8 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-4 ${
          dragActive
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-700'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Drag & Drop Source Documents
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Supports <strong className="text-slate-900 dark:text-slate-200">.pdf</strong>, <strong className="text-slate-900 dark:text-slate-200">.docx</strong>, <strong className="text-slate-900 dark:text-slate-200">.txt</strong>, and <strong className="text-slate-900 dark:text-slate-200">.csv</strong> files up to 10 MB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-semibold cursor-pointer border border-slate-300 dark:border-slate-700 transition-colors shadow-sm">
            Browse Local File
            <input
              type="file"
              onChange={handleFileInput}
              accept=".pdf,.docx,.txt,.csv"
              className="hidden"
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={restrictedMode}
              onChange={(e) => setRestrictedMode(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Lock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Mark as P2 Restricted Source
            </span>
          </label>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Ingested Documents ({sources.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {getFileIcon(src.file_type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate max-w-[160px]">
                      {src.filename}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {src.file_size || '32 KB'} · {src.total_chunks} chunks
                    </span>
                  </div>
                </div>

                {src.restricted ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> P2 Restricted
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-semibold">
                    Processed
                  </span>
                )}
              </div>

              {src.redacted_items_count && src.redacted_items_count > 0 ? (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2 font-mono">
                  <Shield className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    {src.redacted_items_count} API tokens scrubbed ([REDACTED:secret])
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-700 dark:text-slate-400 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Clean text layer & location coordinates</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <span>Owner: {src.owner || 'A. Sample'}</span>
                <span>{src.uploaded_at.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
