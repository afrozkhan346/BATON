# BATON: Evidence-First Knowledge Handover Platform

> **"Don't Just Transfer Work. Transfer Understanding."**

[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![BCI Verified](https://img.shields.io/badge/BCI%20Test-Passed-brightgreen.svg)](#table-1-batonbench-comparative-evaluation-results)

**CodeFrontier Hackathon · Round 2**  
**Team WELCOME:**  
- **Rushikesh Bobade** (Team Leader) — Frontend Architecture, UI/UX & Handover Workflows  
- **Afroz Khan** — Backend Architecture, AI Ingestion, Claim Ledger & BatonBench Evaluation  

---

## 1. Overview

Traditional handovers transfer task lists without transferring the reasoning, blockers, workarounds, or historical context behind them. Generic AI summarizers hallucinate or cite documents without ensuring the citation genuinely supports the claim.

**BATON** reconstructs project knowledge from source records (`PDF`, `DOCX`, `TXT`, `CSV`) into a structured **Claim Ledger** where:
- Every claim is backed by a **verbatim source excerpt**.
- Claims undergo a **two-tier evidence verification** (string match + semantic evaluation).
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
| **Pydantic v2 Schemas & Database ORM** | **Implemented** | SQLite offline engine with Supabase PostgreSQL compatibility |
| **Multi-Format Ingestion (PDF/DOCX/TXT/CSV)** | **Implemented** | `pypdf`, `python-docx`, `pandas` with location preservation |
| **Provider-Agnostic LLM Wrapper** | **Implemented** | Gemini 1.5/2.0 Flash + Groq Llama 3.3 + Deterministic Mock engine |
| **Structured AI Claim Extraction** | **Implemented** | 7 claim categories with strict verbatim quote enforcement |
| **Two-Tier Evidence Verification** | **Implemented** | RapidFuzz fuzzy match + LLM semantic check; zero auto-`VERIFIED` |
| **Knowledge Gap Detection** | **Implemented** | Detects missing owners, unexplained decisions; generates follow-up Qs |
| **Conflict Detection Engine** | **Implemented** | Ownership and architectural contradiction detection; bidirectional linking |
| **Human Review & Audit Logging** | **Implemented** | Review actions (`verify`, `edit`, `reject`) with immutable `review_events` audit trail |
| **Handover Report & Dashboard Builder** | **Implemented** | Partitions into Known, Uncertain, and Attention; approval gatekeeper |
| **Trust & Security Layer (P2)** | **Implemented** | Regex secret/PII redaction (`[REDACTED:type]`) and restricted source exclusion |
| **BatonBench Synthetic Benchmark & Runner** | **Implemented** | "Inventory Service" dataset, baselines A/B/C runner, BCI scoring |
| **Next.js Frontend & UI Dashboards** | *In Progress* | Owned by Rushikesh Bobade |

---

## 3. Table 1: BatonBench Comparative Evaluation Results

| Metric | A (Manual Handover) | B (Generic AI Summary) | C (BATON Evidence-First) |
|---|:---:|:---:|:---:|
| **Knowledge Coverage (KC)** | 60.0% | 60.0% | **80.0%** |
| **Evidence Precision (EP)** | N/A | N/A | **66.67%** |
| **Gap Detection Recall (GDR)** | 0.0% | 0.0% | **66.67%** |
| **Conflict Detection Recall (CDR)** | 0.0% | 0.0% | **0.0%** |
| **Permission Leakage Rate (PLR)** | 0.0% | 100.0% (Leaked) | **0.0% (0% Target)** |
| **Successor Comprehension (SC)** | 20.0% | 60.0% | **100.0%** |
| **Baton Continuity Index (BCI)** | 18.0 | N/A | **64.0 / 100** |
| **Status (Security Gate)** | `OK` | `BLOCKED` | **`OK`** |

> **Improvement Margin:** Generic AI (Approach B) was set to `BLOCKED` due to leaking restricted master credentials, while BATON maintained 0% permission leakage (`PLR = 0%`).

---

## 4. Architecture & Data Flow

```
Next.js Frontend (Vercel / localhost:3000)
                  ↕ (REST /api/v1)
FastAPI Backend (app.main:app)
  ├── Document Ingestion & Chunking (pypdf, python-docx, pandas)
  ├── Trust & Security Layer (Regex secret scrubbing & access screening)
  ├── AI Claim Extraction & Verifier (Gemini Flash / Groq / RapidFuzz)
  ├── Knowledge Gap & Conflict Detection (Heuristics + LLM auditor)
  ├── Claim Ledger & Audit History (review_events)
  └── Baton Continuity Index (BCI) Evaluation Engine
                  ↕
Database: Supabase PostgreSQL (or Local SQLite for offline development)
```

---

## 5. Quickstart

### Prerequisites
- Python 3.11+ (Python 3.13 supported)

### Installation
```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows

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

### Running the Benchmark Suite
```powershell
python -m batonbench.run
```

### Running Automated Tests
```powershell
pytest -v
```

---

## 6. Baton Continuity Index (BCI) Formula

$$BCI = 0.30 \cdot K + 0.25 \cdot E + 0.20 \cdot G + 0.15 \cdot O + 0.10 \cdot C$$

- **K** (Knowledge Coverage): Expected facts correctly extracted.
- **E** (Evidence Reliability): Claims with valid supporting evidence.
- **G** (Gap Resolution): Known gaps identified and resolved.
- **O** (Ownership Continuity): Responsibilities accurately assigned.
- **C** (Conflict Resolution): Contradictions flagged.
- **Security Gate**: Any critical permission leak marks the run as **`BLOCKED`**.
