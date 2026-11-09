# BATON: Technical Decisions & Rationale

**Document:** `docs/technical-decisions.md`  
**Round:** CodeFrontier Hackathon · Round 2  
**Author:** Afroz Khan (Backend & AI)  

---

## 1. Web Framework: FastAPI
- **Choice:** FastAPI (Python 3.13) + Uvicorn + Pydantic v2.
- **Rationale:** 
  - FastAPI provides native async endpoint support, strict type validation via Pydantic v2, and auto-generated OpenAPI documentation.
  - Python is required for parsing libraries (`pypdf`, `python-docx`, `pandas`) and text matching algorithms (`rapidfuzz`).
  - Request/response schemas directly match the JSON payload contracts shared with the frontend.

---

## 2. LLM Provider & Model Choice
- **Primary Model:** Google Gemini 1.5 Flash / Gemini 2.0 Flash (`google-genai`).
- **Secondary / Backup Model:** Groq Llama-3.3-70B-Versatile (`groq`).
- **Rationale:**
  - **Zero Cost:** Both providers offer free API tiers without credit card barriers.
  - **Structured JSON Schema:** Gemini Flash provides first-class support for Pydantic schema validation (`response_schema`), eliminating parse failures.
  - **Exact Quote Extraction:** Flash models demonstrate low hallucination rates when instructed to extract verbatim quotations from context chunks.
  - **Rate Limits:** 15 RPM / 1,500 RPD on Google AI Studio provides sufficient capacity for multi-file chunking and evaluation passes.
- **Design Pattern:** All AI interactions are abstracted through `app/services/llm.py` via `complete_json(prompt, schema)`. Business logic remains decoupled from vendor SDKs.

---

## 3. Evidence Verification Architecture (The Core Differentiator)
- **Problem:** Standard RAG and LLM summarizers cite source files, but the citations frequently fail to support the actual claim made.
- **Two-Layer Solution:**
  1. **Layer 1: String / Fuzzy Matching (`rapidfuzz`):**
     - Verifies that `evidence_excerpt` actually exists in the raw text of the assigned chunk (fuzzy ratio $\ge 0.90$).
     - If the quote does not exist in the source document, the claim is immediately flagged `UNSUPPORTED`.
  2. **Layer 2: Semantic Verification Check (LLM):**
     - An independent prompt evaluates: *"Does this verbatim excerpt logically substantiate this claim? Answer: supports | partial | no"*.
     - If `no`, the claim is downgraded to `UNSUPPORTED`.
     - If `supports` or `partial`, the claim status is set to `NEEDS_REVIEW`.
  3. **Zero Auto-Verification Rule:**
     - Claims never attain `VERIFIED` status programmatically. Only explicit reviewer interaction (`POST /claims/{id}/review` with action `verify`) can transition a claim to `VERIFIED`.

---

## 4. Database Strategy & Offline Development Fallback
- **Primary:** Supabase PostgreSQL (`supabase` Python client).
- **Offline / Local Dev Fallback:** Local SQLite / SQLAlchemy engine.
- **Rationale:** If Supabase credentials are not yet configured or internet access is interrupted, the system automatically falls back to an internal SQLite store with identical schemas and constraints, preventing developer blockage.

---

## 5. Knowledge Gap & Conflict Detection
- **Gaps:** Heuristic and LLM combination:
  - Missing task owners $\rightarrow$ `missing_owner`
  - Unexplained architectural decisions $\rightarrow$ `unexplained_decision`
  - Paused work items $\rightarrow$ `open_question`
  - Generates clear, high-leverage follow-up questions for the successor.
- **Conflicts:** Grouping by subject and pairwise cross-checking:
  - Ownership conflict: Module assigned to Developer A in file 1, but Developer B in file 2.
  - Decision conflict: Tech stack contradictions.

---

## 6. BatonBench & Baton Continuity Index (BCI)
- **Synthetic Data Commitment:** As promised in Round 1, evaluation uses an open, reproducible synthetic dataset ("Inventory Service") with human-verified ground truth.
- **BCI Weighting:**
  $$BCI = 0.30 K + 0.25 E + 0.20 G + 0.15 O + 0.10 C$$
- **Security Gate:** If `PLR` (Permission Leakage Rate) exposes any restricted/confidential entity, BCI status is hard-blocked to `BLOCKED`.
