export type ClaimStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'UNSUPPORTED' | 'CONFLICT' | 'REJECTED';
export type ClaimConfidence = 'high' | 'medium' | 'low';
export type ClaimType = 'decision' | 'task' | 'blocker' | 'dependency' | 'workaround' | 'ownership' | 'next_action';

export type GapKind = 'unexplained_decision' | 'missing_owner' | 'incomplete_docs' | 'conflicting_records' | 'open_question';
export type GapStatus = 'open' | 'resolved';

export interface EvidenceCheck {
  exact_match: boolean;
  match_ratio?: number;
  semantic: 'supports' | 'partial' | 'no';
  note: string;
}

export interface ReviewEvent {
  id: string;
  claim_id: string;
  reviewer: string;
  action: 'verify' | 'edit' | 'reject' | 'resolve';
  previous_status?: ClaimStatus;
  new_status?: ClaimStatus;
  statement_before?: string;
  statement_after?: string;
  note?: string;
  created_at: string;
}

export interface Claim {
  id: string;
  code: string;
  type: ClaimType;
  statement: string;
  source_id: string;
  source_name: string;
  source_date?: string;
  location: string;
  confidence: ClaimConfidence;
  status: ClaimStatus;
  owner?: string | null;
  evidence_excerpt: string;
  evidence_check: EvidenceCheck;
  conflict_with?: string[];
  review_history?: ReviewEvent[];
}

export interface KnowledgeGap {
  id: string;
  kind: GapKind;
  description: string;
  related_claim_id?: string;
  related_claim_code?: string;
  follow_up_question: string;
  status: GapStatus;
  resolution_note?: string | null;
  owner?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface SourceDocument {
  id: string;
  filename: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'csv';
  file_size?: string;
  owner?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'redacted';
  total_chunks: number;
  restricted: boolean;
  redacted_items_count?: number;
  uploaded_at: string;
}

export interface ProjectDashboardMetrics {
  project_id: string;
  project_name: string;
  departing_member: string;
  successor: string;
  project_health: 'Optimal' | 'Mostly on track' | 'Needs Attention' | 'At Risk';
  claims_verified: number;
  claims_total: number;
  gaps_resolved: number;
  gaps_total: number;
  approvals_pending: number;
  pending_tasks: number;
  needs_attention: string[];
  handover_ready: boolean;
}

export interface HandoverReport {
  project_name: string;
  status: 'DRAFT · AWAITING APPROVAL' | 'OFFICIALLY APPROVED';
  handover_ready: boolean;
  approved_by?: string;
  approved_at?: string;
  overview: string;
  what_is_known: Array<{
    claim_id: string;
    code: string;
    statement: string;
    source: string;
    location?: string;
    status: ClaimStatus;
    owner?: string | null;
  }>;
  what_remains_uncertain: Array<{
    claim_id: string;
    code: string;
    statement: string;
    source: string;
    status: ClaimStatus;
    reason: string;
  }>;
  what_needs_attention: Array<{
    kind: GapKind;
    description: string;
    follow_up_question: string;
  }>;
  next_actions: string[];
}

export interface BatonBenchScore {
  knowledge_coverage: number; // K
  evidence_precision: number;  // E
  gap_recall: number;          // G
  ownership_continuity: number;// O
  conflict_recall: number;     // C
  permission_leakage: number;  // PLR (must be 0.0)
  successor_comprehension: number; // SC
  bci_score: number;
  status: 'OK' | 'BLOCKED';
}

export interface ProcessStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress_pct: number;
  chunks_processed: number;
  claims_extracted: number;
  gaps_found: number;
  conflicts_found: number;
  message?: string;
}
