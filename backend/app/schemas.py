from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Any
from datetime import datetime, date


# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str = Field(..., description="Project name")
    departing_member: Optional[str] = Field(None, description="Name of the departing team member")
    successor: Optional[str] = Field(None, description="Name of the successor")


class ProjectResponse(BaseModel):
    id: str
    name: str
    departing_member: Optional[str] = None
    successor: Optional[str] = None
    created_at: datetime


# --- Source Schemas ---
class SourceResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    file_type: str
    owner: Optional[str] = None
    restricted: bool = False
    source_date: Optional[date] = None
    status: str = "uploaded"
    created_at: datetime


# --- Chunk Schemas ---
class ChunkResponse(BaseModel):
    id: str
    source_id: str
    idx: int
    text: str
    location: Optional[str] = None


# --- LLM Extraction Models ---
class ExtractedClaim(BaseModel):
    type: Literal["decision", "task", "blocker", "dependency", "workaround", "ownership", "next_action"]
    statement: str
    evidence_excerpt: str = Field(..., description="Verbatim quotation copied from the chunk text")
    confidence: Literal["high", "medium", "low"]
    owner: Optional[str] = None


class ExtractionResult(BaseModel):
    claims: List[ExtractedClaim] = []


# --- Evidence Verification Models ---
class EvidenceCheck(BaseModel):
    exact_match: bool
    semantic: Literal["supports", "partial", "no"]
    note: Optional[str] = None


class SemanticCheckResult(BaseModel):
    semantic: Literal["supports", "partial", "no"]
    note: str


# --- Claim Ledger Models ---
class ClaimResponse(BaseModel):
    id: str
    project_id: str
    code: Optional[str] = None
    type: str
    statement: str
    source_id: Optional[str] = None
    source_name: Optional[str] = None
    chunk_id: Optional[str] = None
    evidence_excerpt: Optional[str] = None
    source_date: Optional[date] = None
    location: Optional[str] = None
    confidence: Optional[str] = None
    status: Literal["VERIFIED", "NEEDS_REVIEW", "UNSUPPORTED", "CONFLICT", "REJECTED"] = "NEEDS_REVIEW"
    evidence_check: Optional[EvidenceCheck] = None
    conflict_with: List[str] = []
    created_at: datetime


class ClaimReviewRequest(BaseModel):
    reviewer: str
    action: Literal["verify", "edit", "reject", "approve", "add_context"]
    statement: Optional[str] = None
    note: Optional[str] = None


# --- Gap & Conflict Models ---
class GapResponse(BaseModel):
    id: str
    project_id: str
    kind: Literal["unexplained_decision", "missing_owner", "incomplete_docs", "conflicting_records", "open_question"]
    description: str
    related_claim_id: Optional[str] = None
    follow_up_question: Optional[str] = None
    status: Literal["open", "resolved"] = "open"
    resolution_note: Optional[str] = None
    created_at: datetime


class GapResolveRequest(BaseModel):
    reviewer: str
    resolution_note: str
    owner: Optional[str] = None


class ConflictCheckResult(BaseModel):
    contradict: bool
    kind: Optional[str] = None
    note: str


# --- Dashboard & Report Models ---
class DashboardResponse(BaseModel):
    project_id: str
    project_name: str
    departing_member: Optional[str] = None
    successor: Optional[str] = None
    project_health: str = "Mostly on track"
    claims_verified: int
    claims_total: int
    gaps_resolved: int
    gaps_total: int
    approvals_pending: int
    pending_tasks: int
    needs_attention: List[str]
    handover_ready: bool


class HandoverItem(BaseModel):
    claim_id: Optional[str] = None
    code: Optional[str] = None
    statement: str
    source: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None


class HandoverReportResponse(BaseModel):
    project_id: str
    project_name: str
    status: str = "DRAFT · AWAITING APPROVAL"
    handover_ready: bool = False
    overview: str
    what_is_known: List[HandoverItem] = []
    what_remains_uncertain: List[HandoverItem] = []
    what_needs_attention: List[Any] = []
    next_actions: List[str] = []
