# BATON: Evidence-First Knowledge Handover Platform

> **"Don't Just Transfer Work. Transfer Understanding."**

[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![BCI Verified](https://img.shields.io/badge/BCI%20Test-80.75%20Passed-brightgreen.svg)](#batonbench--bci)

**CodeFrontier Hackathon · Round 2**  
**Team WELCOME:**  
- **Rushikesh Bobade** (Team Leader) — Frontend, UX & Handover Workflows  
- **Afroz Khan** — Backend Architecture, AI/ML Ingestion & BatonBench Evaluation  

---

## 1. Overview

Traditional handovers transfer tasks without transferring the reasoning, blockers, workarounds, or historical context behind them. Generic AI summarizers hallucinate or cite documents without ensuring the citation genuinely supports the claim.

**BATON** reconstructs project knowledge from source records (`PDF`, `DOCX`, `TXT`, `CSV`) into a structured **Claim Ledger** where:
- Every claim is backed by a **verbatim source excerpt**.
- Claims undergo a **two-layer evidence verification** (string match + semantic evaluation).
- Unsubstantiated claims are explicitly designated `UNSUPPORTED` — nothing is ever auto-`VERIFIED`.
- Missing context and contradictions become explicit **Knowledge Gaps** and **Conflicts** with actionable follow-up questions.
- A human reviewer verifies or rejects claims before producing the official **Handover Report**.

---

## 2. Implemented vs. Planned Status

> **Honest-Status Rule:** Only functional, tested capabilities are claimed as implemented.

| Capability / Deliverable | Status | Details |
|---|:---:|---|
| **FastAPI Backend Skeleton & Routers** | **Implemented** | Health, Projects, Sources, Claims, Gaps, Review, Report endpoints |
| **API Contract Specification** | **Implemented** | Defined in `docs/api-contract.md` with mock parity for frontend |
| **Pydantic v2 Schemas & ORM Database** | **Implemented** | SQLite offline engine with Supabase PostgreSQL compatibility |
| **Baton Continuity Index (BCI) Engine** | **Implemented** | BCI formula with security gate; tested proposal example = 80.75 |
| **Review Audit Logging & Constraints** | **Implemented** | Verification requires evidence; logs all before/after transitions |
| **Document Ingestion (PDF/DOCX/TXT/CSV)** | *Phase 2* | Parsing per format with location tracking (`page X`, `row N`) |
| **AI Extraction & Two-Layer Verifier** | *Phase 3* | RapidFuzz fuzzy match + LLM semantic verification (`supports/partial/no`) |
| **Gap & Conflict Detection Engine** | *Phase 4* | Rule-based and LLM contradiction detection |
| **BatonBench Synthetic Dataset & Runner** | *Phase 6* | "Inventory Service" dataset, baselines A/B/C runner |
| **P2 Sensitive-Info Redaction & Auth** | *Phase 5* | Regex key redaction (`[REDACTED:type]`) and restricted source exclusion |
| **Next.js Frontend & UI Dashboards** | *In Progress* | Owned by Rushikesh Bobade |

---

## 3. Architecture & Data Flow

```
Next.js Frontend (Vercel / localhost:3000)
                  ↕ (REST /api/v1)
FastAPI Backend (app.main:app)
  ├── Document Ingestion & Chunking (pypdf, python-docx, pandas)
  ├── AI Claim Extraction & Verifier (Gemini Flash / Groq / RapidFuzz)
  ├── Claim Ledger & Audit History (review_events)
  └── Baton Continuity Index (BCI) Evaluation Engine
                  ↕
Database: Supabase PostgreSQL (or Local SQLite for offline development)
```

---

## 4. Quickstart (Backend)

### Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Virtual environment tool

### Installation
```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

### Running the API Server
```powershell
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### Running Automated Tests
```powershell
pytest -v
```

---

## 5. BatonBench & BCI Formula

$$BCI = 0.30 \cdot K + 0.25 \cdot E + 0.20 \cdot G + 0.15 \cdot O + 0.10 \cdot C$$

- **K** (Knowledge Coverage): Expected facts correctly extracted.
- **E** (Evidence Reliability): Claims with valid supporting evidence.
- **G** (Gap Resolution): Known gaps identified and resolved.
- **O** (Ownership Continuity): Responsibilities accurately assigned.
- **C** (Conflict Resolution): Contradictions flagged.
- **Security Gate**: Any critical permission leak marks the run as **`BLOCKED`**.
