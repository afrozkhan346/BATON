# BATON: Round 2 Development Plan (Afroz Khan)

**Team WELCOME** · Rushikesh Bobade (Frontend/UX) · Afroz Khan (Backend/AI/Evaluation)
**Build window:** 10:00 AM, 7 Nov → 10:00 AM, 10 Nov 2026 (72h)
**My scope:** ingestion, AI extraction, Claim Ledger backend, gap and conflict detection, backend APIs, BatonBench, BCI, integration with frontend.

> Honest-status rule from our proposal still applies: only claim what is built and tested. Anything unfinished goes in the README under "Planned", not "Implemented".

---

## 0. Priorities (cut from the bottom if time runs out)

| Priority | Deliverable | Done when |
|---|---|---|
| **P0** | Upload PDF/DOCX/TXT/CSV → text with source + location preserved | `POST /sources` returns chunks with metadata |
| **P0** | LLM extraction → structured claims with evidence excerpt | Claims saved as `unverified` with a source ref |
| **P0** | Evidence verification (excerpt must exist in source and support the claim) | Unsupported claims get `UNSUPPORTED`, never `VERIFIED` automatically |
| **P0** | Review API (verify / edit / reject / approve) + audit log | Status changes recorded with who/when |
| **P0** | Handover report endpoint (approved claims only) | Returns the JSON payload Rushikesh renders |
| **P1** | Gap detection + follow-up questions | Synthetic dataset gaps are flagged |
| **P1** | Conflict detection | Planted conflicts flagged |
| **P1** | Synthetic dataset + BatonBench runner + BCI | One full run produces a results table |
| **P2** | Sensitive-info screen (regex for secrets/emails/phones) | Redacts before LLM call, logs exclusion |
| **P2** | Authorisation check (simple role flag) | Restricted source excluded from AI + report |
| **P3** | GitHub ingestion, pgvector | Only if everything above is done |

**Rule:** P0 end-to-end working with the frontend beats P1/P2 half-done.

---

## 1. Timeline (backwards from the 10:00 AM deadline)

Adjust to however many hours are actually left. If you are already past a phase, merge it with the next one.

| Block | Focus | Exit check |
|---|---|---|
| **A. Foundations** | Repo, env, Supabase schema, FastAPI skeleton, CORS, health route, API contract shared with Rushikesh | Rushikesh can call `/health` and see a mock claim list |
| **B. Ingestion** | Upload, validation, extraction per file type, chunking with locations | 4 sample files ingest cleanly |
| **C. Extraction + ledger** | LLM structured output, Pydantic validation, evidence matching, save claims | Run on sample project → ≥15 claims with sources |
| **D. Review + report** | Review endpoints, audit log, report builder | Frontend can verify a claim and generate a report |
| **E. Integration + deploy** | Connect to Rushikesh's UI, deploy backend + frontend, fix CORS/env issues | Live URL works end to end |
| **F. Gaps + conflicts** (P1) | Detection prompts + rules | Dashboard "needs attention" is real data |
| **G. BatonBench + BCI** (P1) | Dataset, three baselines, scoring script, results table | `python -m batonbench.run` prints table |
| **H. Freeze** | README, demo script, backup video, bug fixes only | No new features in the last 3 hours |

**Hard freeze:** no new features in the last 3 hours before deadline. Deploy and record a backup demo video before that.

---

## 2. Architecture (as proposed in Round 1)

```
Next.js (Vercel) ⇄ FastAPI ⇄ LLM API
                      ⇅
              Supabase PostgreSQL
```

Pipeline per project:

```
upload → validate → extract text → chunk (keep source_id + location)
      → [sensitive screen → authorisation filter]   (P2)
      → LLM extraction (structured JSON)
      → evidence check (string match + semantic check)
      → save claims (status: NEEDS_REVIEW / UNSUPPORTED / CONFLICT)
      → gap + conflict detection
      → human review → approved ledger → handover report
```

**Backend hosting:** Vercel hosts the frontend only. Deploy FastAPI on Render or Railway (free tier is fine, a single Dockerfile or `uvicorn` start command). Decide this early; it is the most common last-hour failure.

---

## 3. Repo structure

```
baton/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routers
│   │   ├── config.py            # env settings
│   │   ├── db.py                # Supabase/Postgres client
│   │   ├── schemas.py           # Pydantic models (API + LLM output)
│   │   ├── routers/
│   │   │   ├── projects.py
│   │   │   ├── sources.py
│   │   │   ├── claims.py
│   │   │   ├── gaps.py
│   │   │   ├── review.py
│   │   │   └── report.py
│   │   ├── services/
│   │   │   ├── ingest.py        # file → text + locations
│   │   │   ├── chunking.py
│   │   │   ├── extract.py       # LLM extraction
│   │   │   ├── evidence.py      # verification logic
│   │   │   ├── gaps.py
│   │   │   ├── conflicts.py
│   │   │   ├── sensitive.py     # P2
│   │   │   ├── report.py
│   │   │   └── llm.py           # provider wrapper (one place to swap models)
│   │   └── prompts/
│   │       ├── extract.md
│   │       ├── semantic_check.md
│   │       ├── gaps.md
│   │       └── conflicts.md
│   ├── batonbench/
│   │   ├── dataset/             # synthetic project + ground_truth.json
│   │   ├── baselines.py         # A manual, B generic AI summary
│   │   ├── score.py             # KC, EP, GDR, CDR, PLR, SC
│   │   ├── bci.py
│   │   └── run.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/                    # Rushikesh
├── docs/
│   ├── api-contract.md
│   └── technical-decisions.md
├── sample_data/
└── README.md
```

---

## 4. Database schema (Supabase PostgreSQL)

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  departing_member text,
  successor text,
  created_at timestamptz default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  filename text not null,
  file_type text not null,              -- pdf | docx | txt | csv
  owner text,
  restricted boolean default false,     -- P2 authorisation flag
  source_date date,
  status text default 'uploaded',       -- uploaded | processed | excluded | failed
  created_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  idx int not null,
  text text not null,
  location text,                        -- "page 3", "section 3.2", "row 14", "line 40-52"
  created_at timestamptz default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  code text,                            -- C-014 style display id
  type text not null,                   -- decision | task | blocker | dependency | workaround | ownership | next_action
  statement text not null,
  source_id uuid references sources(id),
  chunk_id uuid references chunks(id),
  evidence_excerpt text,
  source_date date,
  location text,
  confidence text,                      -- high | medium | low
  status text not null default 'NEEDS_REVIEW',
    -- VERIFIED | NEEDS_REVIEW | UNSUPPORTED | CONFLICT | REJECTED
  evidence_check jsonb,                 -- {exact_match: bool, semantic: "supports|partial|no", note: "..."}
  conflict_with uuid[],
  created_at timestamptz default now()
);

create table gaps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text not null,                   -- unexplained_decision | missing_owner | incomplete_docs | conflicting_records | open_question
  description text not null,
  related_claim_id uuid references claims(id),
  follow_up_question text,
  status text default 'open',           -- open | resolved
  resolution_note text,
  created_at timestamptz default now()
);

create table review_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references claims(id) on delete cascade,
  reviewer text not null,
  action text not null,                 -- verify | edit | reject | approve | add_context
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

create table exclusion_log (            -- P2
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id),
  reason text,                          -- restricted | sensitive_redacted
  detail text,
  created_at timestamptz default now()
);
```

**Rule enforced in code, not just in docs:** a claim can only become `VERIFIED` if `evidence_excerpt` is non-empty AND the evidence check passed AND a reviewer action exists in `review_events`.

---

## 5. API contract (share with Rushikesh at the start)

Base: `/api/v1`. All JSON. Write this into `docs/api-contract.md` and agree on it before building anything else. Mock the responses first so his UI is never blocked.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Project + summary counts (dashboard) |
| POST | `/projects/{id}/sources` | Upload file(s), multipart |
| GET | `/projects/{id}/sources` | List sources + status |
| POST | `/projects/{id}/process` | Run extraction pipeline (async/background) |
| GET | `/projects/{id}/process/status` | Progress for a spinner |
| GET | `/projects/{id}/claims?status=&type=` | Claim Ledger list |
| GET | `/claims/{id}` | Claim detail + evidence + review history |
| POST | `/claims/{id}/review` | `{action: verify\|edit\|reject, reviewer, statement?, note?}` |
| GET | `/projects/{id}/gaps` | Knowledge gaps |
| POST | `/gaps/{id}/resolve` | `{reviewer, note, owner?}` |
| POST | `/projects/{id}/approve` | Approve the ledger for the report |
| GET | `/projects/{id}/report` | Handover report payload |
| GET | `/projects/{id}/dashboard` | Health, pending tasks, gaps, readiness numbers |

**Dashboard payload** (matches Mockup 1):

```json
{
  "claims_verified": 18, "claims_total": 27,
  "gaps_resolved": 2, "gaps_total": 4,
  "approvals_pending": 3,
  "pending_tasks": 14,
  "needs_attention": ["Sync endpoint has no owner", "..."],
  "handover_ready": false
}
```

**Report payload** (matches Mockups 3 and 4): `overview`, `decisions[]`, `responsibilities[]`, `blockers[]`, `dependencies[]`, `next_actions[]`, `known[]`, `uncertain[]`, `attention[]`. Every item carries `claim_id`, `source`, `status`.

---

## 6. Component specs

### 6.1 Ingestion (`services/ingest.py`)
- Validate extension + size cap (e.g. 10 MB). Reject anything else with a clear error.
- **PDF:** `pypdf` or `pdfplumber`, per page → location `"page N"`.
- **DOCX:** `python-docx`, by paragraph; use heading text as location (`"section: Architecture"`). Fall back to paragraph index.
- **TXT:** by line ranges → location `"lines 40-52"`.
- **CSV:** `pandas`/`csv`; one chunk per row group, location `"row N"`; keep column headers in the chunk text.
- Scanned PDFs with no text layer: mark source `failed` with reason. OCR is out of scope.
- Chunk ~800-1200 characters with ~100 overlap, never crossing source boundaries. Every chunk keeps `source_id` and `location`.

### 6.2 LLM wrapper (`services/llm.py`)
- One function `complete_json(prompt, schema)`; the rest of the code never touches the provider SDK directly.
- Use a model with structured/JSON output. Record the chosen model in `docs/technical-decisions.md` (the proposal deferred this to Round 2).
- Temperature low (0 to 0.2). Retry once on invalid JSON, then mark chunk batch `failed` and continue.
- Put the API key in env only. Never commit it.

### 6.3 Extraction (`services/extract.py`)
Pydantic model the LLM must return:

```python
class ExtractedClaim(BaseModel):
    type: Literal["decision","task","blocker","dependency","workaround","ownership","next_action"]
    statement: str
    evidence_excerpt: str      # must be copied verbatim from the chunk
    confidence: Literal["high","medium","low"]
    owner: str | None = None

class ExtractionResult(BaseModel):
    claims: list[ExtractedClaim]
```

Prompt rules (`prompts/extract.md`):
1. Extract only what the text states. Do not infer or fill gaps.
2. `evidence_excerpt` must be a verbatim quote from the chunk.
3. If a reason for a decision is not stated, extract the decision and do not invent the reason.
4. Mark `confidence: low` for indirect or ambiguous statements.
5. Return an empty list if nothing relevant is present.

Process chunks in batches; run concurrently with a small limit (3 to 5) to respect rate limits. Dedupe near-identical claims afterward (normalised text + same source).

### 6.4 Evidence verification (`services/evidence.py`): the core differentiator
Two layers, matching the proposal's "a cited source alone is not enough":

1. **Exact/near match:** normalise whitespace and case, check the excerpt appears in the chunk (fuzzy ratio ≥ ~0.9 using `rapidfuzz`). Fail → `UNSUPPORTED`.
2. **Semantic check:** short LLM call: "Does this excerpt support this claim? Answer `supports`, `partial` or `no`, with one sentence." `no` → `UNSUPPORTED`; `partial` → `NEEDS_REVIEW` with a note; `supports` → `NEEDS_REVIEW` (awaiting human).

Store the result in `claims.evidence_check`. Note that **nothing is auto-`VERIFIED`**. The status becomes `VERIFIED` only when a human reviewer verifies it (matches "AI proposes; humans decide").

### 6.5 Conflict detection (`services/conflicts.py`)
- Group claims by type and subject (e.g. "owner of auth module", "database choice").
- Rule-based pass for ownership: same subject, different owner across sources → conflict.
- LLM pass for the rest: send candidate pairs (same type, similar embedding or keyword overlap), ask "contradict / consistent / unrelated".
- On conflict: set both claims to `CONFLICT`, fill `conflict_with`.
- Keep the pair count small: only compare within type and top-N similar by keyword overlap. (Skip embeddings unless time allows.)

### 6.6 Gap detection (`services/gaps.py`)
Rule-based first (fast, predictable), LLM for wording:
- `decision` claim with no stated reason → `unexplained_decision`
- `task`/`blocker` with no owner → `missing_owner`
- `blocker`/`dependency` whose dependency has no claim → `incomplete_docs`
- Claim marked "paused/unfinished/TBD/waiting" → `open_question`
- Each gap gets a generated `follow_up_question`.
- Resolving a gap stores `resolution_note` and optional owner, which becomes a new reviewer-sourced claim. **Never auto-fill an answer.**

### 6.7 Review workflow (`routers/review.py`)
- `verify` → status `VERIFIED` (only allowed if `evidence_excerpt` exists and evidence check is not `no`).
- `edit` → update statement, set `NEEDS_REVIEW`, log before/after.
- `reject` → `REJECTED`.
- Every action writes `review_events`.
- `POST /projects/{id}/approve` blocks if any claim is still `NEEDS_REVIEW` (or returns a warning list; decide with Rushikesh).

### 6.8 Report builder (`services/report.py`)
- Include only `VERIFIED` claims in "What is known".
- `NEEDS_REVIEW`, `UNSUPPORTED`, `CONFLICT` → "What remains uncertain".
- Open gaps + ownerless items → "What needs attention".
- Next actions: from `next_action` claims + unresolved gaps. Optional LLM pass to order and phrase them; each action must reference a claim or gap id.
- If not all approved: report `status: "DRAFT · AWAITING APPROVAL"`.

### 6.9 Trust features (P2, do these only after P0 and P1)
- **Sensitive screen:** regex for API keys (`sk-`, `AKIA`, `ghp_`), emails, phone numbers, password-like lines. Replace with `[REDACTED:type]` before the LLM call; write an `exclusion_log` row.
- **Authorisation:** `sources.restricted = true` → skip entirely before AI processing and log it. Report endpoint takes a `viewer_role`; restricted-derived content is never returned.
- These support the PLR security gate in BatonBench; implement at least the restricted-source path so PLR can be tested for real.

---

## 7. BatonBench and BCI

### 7.1 Synthetic dataset (`batonbench/dataset/`)
Create one small project, e.g. "Inventory Service" (matches mockups), with 4 to 6 files: `architecture_notes_v2.docx`, `sprint_notes.txt`, `tasks.csv`, `roadmap.pdf`, `chat_export.txt`, plus one **restricted** file with a fake secret.

`ground_truth.json` (hand-written, then human-verified):

```json
{
  "expected_facts": [{"id": "F1", "text": "...", "source": "..."}],
  "known_gaps": [{"id": "G1", "text": "No reason documented for sync pause"}],
  "known_conflicts": [{"id": "X1", "text": "tasks.csv vs chat_export disagree on auth owner"}],
  "ownership_items": [{"id": "O1", "item": "Auth module", "owner": "B. Sample"}],
  "restricted_facts": [{"id": "R1", "text": "fake API key / salary note"}],
  "successor_questions": [{"id": "Q1", "question": "...", "answer": "..."}]
}
```

Target: ~20 facts, 4 gaps, 3 conflicts, 5 ownership items, 2 restricted facts, 10 questions. Small but real beats big and unfinished. **Use synthetic data only** (proposal commitment).

### 7.2 Three approaches (same inputs)
- **A: Manual handover:** a plain handover note written by hand from the same files (ideally by a teammate not looking at ground truth). Keep it honest and time-boxed.
- **B: Generic AI summary:** one LLM call "summarise these files for a successor", no evidence rules.
- **C: BATON:** the full pipeline output (approved or auto-reviewed in a documented way for the benchmark; state which).

### 7.3 Scoring (`score.py`)
| Metric | How |
|---|---|
| **KC** | Facts matched / total expected. Match by LLM judge with a fixed rubric + manual spot check |
| **EP** | Claims with valid supporting evidence / total claims. Only meaningful for C (B has no claims; report N/A, don't invent) |
| **GDR** | Known gaps detected / total gaps |
| **CDR** | Known conflicts detected / total conflicts |
| **PLR** | Restricted facts exposed / restricted facts tested (0% target, N/A if none tested) |
| **SC** | An LLM "successor" answers the question set using only the handover; score vs ground truth |
| **O** | Ownership items correctly assigned / total |
| **G** | Known gaps identified and resolved or assigned / total |

### 7.4 BCI (`bci.py`)

```python
def bci(K, E, G, O, C, plr_critical_leak: bool):
    if plr_critical_leak:
        return {"status": "BLOCKED", "bci": None}
    score = 0.30*K + 0.25*E + 0.20*G + 0.15*O + 0.10*C
    return {"status": "OK", "bci": round(score, 2)}
```

- Mapping: K=KC, E=EP, C=CDR (per proposal).
- Add a unit test with the worked example from the proposal: inputs 80/90/70/85/75 → **80.75**. This test is a free, visible correctness proof.
- Run 3 repeats for each approach and report the mean ΔBCI = BCI_C − BCI_B. Report weak results honestly; the proposal promised that.
- Fill Table 1 (the empty results template) automatically from the run, output as Markdown + JSON, and show it in the demo.

---

## 8. Integration with Rushikesh

- **First thing:** push `docs/api-contract.md` + a mock server (or hardcoded JSON routes) so he can build against it immediately.
- Agree on: status enum strings (`VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`, `CONFLICT`, `REJECTED`), claim code format, date format (ISO), error shape `{error, detail}`.
- CORS: allow the Vercel domain + `localhost:3000`.
- Frontend env var: `NEXT_PUBLIC_API_URL`.
- Do a joint test at the end of Block D and again at Block E. Do not wait until the last day to connect.
- Daily short sync (5 min): what is blocked, what changed in the contract.

---

## 9. Testing checklist

**Automated (pytest, keep small):**
- [ ] Each file type ingests with correct locations
- [ ] Evidence matcher: exact quote passes, altered quote fails
- [ ] A claim with empty evidence can never be `VERIFIED`
- [ ] BCI worked example = 80.75; critical leak → BLOCKED
- [ ] Review endpoints write `review_events`
- [ ] Restricted source never reaches the LLM call (mock the LLM and assert)

**Manual end to end (before freeze):**
- [ ] Upload all sample files → process → claims appear
- [ ] Verify one, reject one, edit one → dashboard counts update
- [ ] Resolve a gap with an owner → report reflects it
- [ ] Generate report → unverified items appear under "uncertain"
- [ ] Run on the deployed URL, not just localhost

---

## 10. Deployment

1. Supabase project → run schema SQL → copy URL + service key.
2. Backend on Render/Railway: start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `LLM_API_KEY`, `ALLOWED_ORIGINS`.
3. Frontend on Vercel (Rushikesh): set `NEXT_PUBLIC_API_URL` to the backend URL.
4. Free-tier backends sleep. **Hit `/health` a few minutes before any demo** to wake it.
5. Keep `.env.example` in the repo; never commit real keys. Rotate any key that leaked.

---

## 11. Risks and fallbacks

| Risk | Fallback |
|---|---|
| LLM returns invalid JSON | Pydantic validation + one retry; skip the batch and log |
| LLM rate limits/timeouts | Limit concurrency to 3; process in background; cache results per chunk hash |
| Backend sleeps / deploy breaks | Backup demo video + local run with the same sample data |
| Semantic check too slow | Run only on claims that pass exact match; batch several per call |
| Gap/conflict LLM passes unreliable | Keep the rule-based version as default; LLM only phrases questions |
| Out of time for BatonBench | Ship the dataset + scoring script + BCI test; run at least B vs C once and report only what ran |
| Cross-team contract drift | Single `api-contract.md`; change it in a commit, tell Rushikesh immediately |

---

## 12. Final-day checklist (last 3 hours: freeze)

- [ ] Backend deployed, frontend connected, live URL tested from a different device
- [ ] Sample data loaded; the demo project runs start to finish in under 3 minutes
- [ ] README: what it is, how to run locally, architecture, **Implemented vs Planned** table, BatonBench instructions, team contributions
- [ ] `docs/technical-decisions.md`: chosen model, why FastAPI/Supabase, evidence-check design, known limits
- [ ] Results table from a real BatonBench run included (or clearly marked "not run")
- [ ] 2-3 minute backup demo video recorded
- [ ] Repo clean: no keys, no dead code, meaningful commit history (both members visible)
- [ ] Submission made before the deadline, with a few minutes of buffer

---

## 13. Demo script (suggested, 3 minutes)

1. **Problem (20s):** "A developer left. The successor gets tasks, not understanding."
2. **Upload (20s):** drop the 5 synthetic files.
3. **Claim Ledger (60s):** open C-021, show the quote, source, date, confidence; verify one, reject one. Show an `UNSUPPORTED` claim that BATON refused to trust.
4. **Gaps and conflicts (30s):** "sync endpoint has no owner", "auth owner conflict"; resolve one with a human note.
5. **Handover report + successor view (30s):** known vs uncertain vs next actions.
6. **BatonBench (20s):** the results table, and the security gate (BLOCKED if a restricted fact leaks).

---

## 14. What I should do next (first 60 minutes from now)

1. Create the repo + `docs/api-contract.md`, send it to Rushikesh.
2. Run the Supabase schema.
3. FastAPI skeleton with `/health` and mock `/claims` + `/dashboard` + `/report` routes, deployed.
4. Then start Block B (ingestion), and write the 5 sample files in parallel, since you need them for extraction testing and BatonBench anyway.
