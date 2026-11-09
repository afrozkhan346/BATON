# BATON API Contract (v1)

**Version:** 1.0.0  
**Base Path:** `/api/v1`  
**Data Format:** JSON (all requests and responses)  
**Standard Status Values:**  
- Claim Status: `VERIFIED` | `NEEDS_REVIEW` | `UNSUPPORTED` | `CONFLICT` | `REJECTED`  
- Claim Confidence: `high` | `medium` | `low`  
- Claim Type: `decision` | `task` | `blocker` | `dependency` | `workaround` | `ownership` | `next_action`  
- Gap Kind: `unexplained_decision` | `missing_owner` | `incomplete_docs` | `conflicting_records` | `open_question`  
- Gap Status: `open` | `resolved`  

---

## 1. System & Health

### `GET /health`
Liveness check.
```json
// 200 OK
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "llm_provider": "gemini"
}
```

---

## 2. Projects

### `POST /api/v1/projects`
Create a new project handover workspace.
- **Request Body:**
```json
{
  "name": "Inventory Service",
  "departing_member": "A. Sample",
  "successor": "B. Sample"
}
```
- **Response:**
```json
// 201 Created
{
  "id": "e4b6d812-78d1-4b72-a4f5-5192083bc701",
  "name": "Inventory Service",
  "departing_member": "A. Sample",
  "successor": "B. Sample",
  "created_at": "2026-11-09T14:00:00Z"
}
```

### `GET /api/v1/projects/{id}`
Retrieve project details.

### `GET /api/v1/projects/{id}/dashboard`
Provides counts and metrics for Mockup 1 (Project Dashboard).
- **Response:**
```json
// 200 OK
{
  "project_id": "e4b6d812-78d1-4b72-a4f5-5192083bc701",
  "project_name": "Inventory Service",
  "departing_member": "A. Sample",
  "successor": "B. Sample",
  "project_health": "Mostly on track",
  "claims_verified": 18,
  "claims_total": 27,
  "gaps_resolved": 2,
  "gaps_total": 4,
  "approvals_pending": 3,
  "pending_tasks": 14,
  "needs_attention": [
    "Sync endpoint has no owner",
    "Database choice: no documented reason",
    "API docs conflict with the code"
  ],
  "handover_ready": false
}
```

---

## 3. Sources & Ingestion

### `POST /api/v1/projects/{id}/sources`
Upload one or more source files (multipart/form-data).
- **Form Data:**
  - `file`: Binary file (`.pdf`, `.docx`, `.txt`, `.csv`)
  - `owner`: (Optional) Author or uploader
  - `restricted`: (Optional) boolean (`true` for restricted access / P2)
- **Response:**
```json
// 201 Created
{
  "source_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "filename": "architecture_notes_v2.docx",
  "file_type": "docx",
  "status": "uploaded",
  "total_chunks": 8
}
```

### `GET /api/v1/projects/{id}/sources`
List all uploaded sources and their ingestion statuses.

### `POST /api/v1/projects/{id}/process`
Trigger extraction & evidence verification pipeline for all uploaded sources.
- **Response:**
```json
// 202 Accepted
{
  "job_id": "job_01",
  "status": "processing",
  "message": "AI extraction and verification started"
}
```

### `GET /api/v1/projects/{id}/process/status`
Check processing status for spinner / progress bar.
- **Response:**
```json
// 200 OK
{
  "status": "completed",
  "progress_pct": 100,
  "chunks_processed": 32,
  "claims_extracted": 27,
  "gaps_found": 4,
  "conflicts_found": 2
}
```

---

## 4. Claim Ledger

### `GET /api/v1/projects/{id}/claims`
Query Claim Ledger with optional filters.
- **Query Parameters:**
  - `status`: Filter by `VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`, `CONFLICT`, `REJECTED`
  - `type`: Filter by claim type (`decision`, `task`, `blocker`, etc.)
- **Response:**
```json
// 200 OK
[
  {
    "id": "c-021-uuid",
    "code": "C-021",
    "type": "blocker",
    "statement": "Sync endpoint paused before completion",
    "source_id": "source-uuid",
    "source_name": "sprint_notes.txt",
    "source_date": "2026-05-02",
    "location": "lines 14-26",
    "confidence": "medium",
    "status": "NEEDS_REVIEW",
    "evidence_excerpt": "Sync work stopped here; waiting on the rate-limit decision.",
    "evidence_check": {
      "exact_match": true,
      "semantic": "supports",
      "note": "Excerpt explicitly states sync work stopped waiting on rate-limit decision"
    },
    "conflict_with": []
  }
]
```

### `GET /api/v1/claims/{id}`
Get full claim details including quotation, chunk context, and review audit trail.

### `POST /api/v1/claims/{id}/review`
Reviewer human decision on a claim.
- **Request Body:**
```json
{
  "reviewer": "Rushikesh Bobade",
  "action": "verify",
  "statement": "Updated statement if editing",
  "note": "Confirmed with sprint logs"
}
```
*Note: A claim cannot be marked `VERIFIED` if evidence is missing or evidence check is `no`.*

---

## 5. Knowledge Gaps & Conflicts

### `GET /api/v1/projects/{id}/gaps`
Retrieve detected gaps.
- **Response:**
```json
// 200 OK
[
  {
    "id": "gap-01-uuid",
    "kind": "missing_owner",
    "description": "The sync endpoint was left unfinished with no designated owner.",
    "related_claim_id": "c-021-uuid",
    "follow_up_question": "Why was the sync endpoint paused, and who is responsible for resuming it?",
    "status": "open",
    "resolution_note": null
  }
]
```

### `POST /api/v1/gaps/{id}/resolve`
Resolve a gap with a human explanation and optional new owner.
- **Request Body:**
```json
{
  "reviewer": "Rushikesh Bobade",
  "resolution_note": "Sync endpoint resumed by B. Sample following rate-limit fix.",
  "owner": "B. Sample"
}
```

---

## 6. Handover Report & Successor View

### `GET /api/v1/projects/{id}/report`
Returns the structured Handover Report matching Mockups 3 & 4.
- **Response:**
```json
// 200 OK
{
  "project_name": "Inventory Service",
  "status": "DRAFT · AWAITING APPROVAL",
  "handover_ready": false,
  "overview": "Tracks stock across warehouses. The core API is live; the sync endpoint is incomplete.",
  "what_is_known": [
    {
      "claim_id": "c-014-uuid",
      "code": "C-014",
      "statement": "PostgreSQL selected for relational reporting",
      "source": "architecture_notes_v2.docx",
      "status": "VERIFIED"
    }
  ],
  "what_remains_uncertain": [
    {
      "claim_id": "c-021-uuid",
      "code": "C-021",
      "statement": "Sync endpoint paused before completion",
      "source": "sprint_notes.txt",
      "status": "NEEDS_REVIEW",
      "reason": "Awaiting human verification"
    }
  ],
  "what_needs_attention": [
    {
      "kind": "missing_owner",
      "description": "Sync endpoint has no owner.",
      "follow_up_question": "Who will take ownership of the sync endpoint?"
    }
  ],
  "next_actions": [
    "Assign a sync owner",
    "Resolve the rate-limit decision",
    "Review the deploy workaround"
  ]
}
```

### `POST /api/v1/projects/{id}/approve`
Formally approve the handover report. Only allowed if zero unreviewed critical claims remain.
