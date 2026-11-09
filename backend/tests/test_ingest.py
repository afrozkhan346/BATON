import pytest
import io
import pypdf
import docx

from app.services.ingest import (
    ingest_document,
    validate_file_metadata,
    extract_from_txt,
    extract_from_csv,
    extract_from_docx,
    extract_from_pdf,
    IngestionError,
)
from app.services.chunking import chunk_text


def test_txt_ingestion():
    txt_content = (
        "Line 1: Architecture setup.\n"
        "Line 2: PostgreSQL configured.\n"
        "Line 3: Fast API router added.\n"
    ).encode("utf-8")

    chunks = ingest_document("notes.txt", txt_content)
    assert len(chunks) >= 1
    assert "Line 1" in chunks[0]["text"]
    assert "line" in chunks[0]["location"]
    assert chunks[0]["idx"] == 0


def test_csv_ingestion():
    csv_content = (
        "Task,Owner,Status\n"
        "Auth Module,Alice,Done\n"
        "Sync Endpoint,Bob,Blocked\n"
    ).encode("utf-8")

    chunks = ingest_document("tasks.csv", csv_content)
    assert len(chunks) >= 1
    assert "Task: Auth Module" in chunks[0]["text"]
    assert "row" in chunks[0]["location"]


def test_docx_ingestion():
    # Build a small in-memory docx
    doc = docx.Document()
    doc.add_heading("Architecture Decisions", level=1)
    doc.add_paragraph("We decided to use PostgreSQL for relational reporting.")
    doc.add_heading("Known Blockers", level=1)
    doc.add_paragraph("The sync endpoint is currently paused pending rate-limit decisions.")

    buf = io.BytesIO()
    doc.save(buf)
    docx_bytes = buf.getvalue()

    chunks = ingest_document("architecture.docx", docx_bytes)
    assert len(chunks) >= 2
    assert any("Architecture Decisions" in c["location"] for c in chunks)
    assert any("PostgreSQL" in c["text"] for c in chunks)


def test_pdf_ingestion():
    # Build a small in-memory PDF using pypdf
    writer = pypdf.PdfWriter()
    page1 = writer.add_blank_page(width=200, height=200)
    # pypdf cannot write arbitrary text directly without canvas, but we can test
    # empty page detection or create a minimal page with text if possible,
    # or test the reader with text stream.
    # Let's create a minimal PDF stream containing text:
    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj\n"
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"5 0 obj << /Length 55 >> stream\n"
        b"BT /F1 12 Tf 100 700 Td (BATON PDF Ingestion Test String) Tj ET\n"
        b"endstream\n"
        b"endobj\n"
        b"xref\n"
        b"0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000244 00000 n \n"
        b"0000000318 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\n"
        b"startxref\n"
        b"424\n"
        b"%%EOF\n"
    )

    chunks = ingest_document("test_manual.pdf", pdf_bytes)
    assert len(chunks) == 1
    assert "BATON PDF Ingestion Test String" in chunks[0]["text"]
    assert chunks[0]["location"] == "page 1"


def test_invalid_file_extension():
    with pytest.raises(IngestionError, match="Unsupported file format"):
        ingest_document("malicious.exe", b"binary content")


def test_file_size_limit():
    large_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB
    with pytest.raises(IngestionError, match="exceeds 10MB limit"):
        ingest_document("large.txt", large_bytes)


def test_chunking_service():
    sample_text = "Word " * 500  # ~2500 characters
    chunks = chunk_text(sample_text, location="section: Core", chunk_size=800, overlap=100)
    assert len(chunks) > 1
    for c in chunks:
        assert c["location"] == "section: Core"
        assert len(c["text"]) <= 900
