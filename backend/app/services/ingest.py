import os
import io
import csv
from typing import List, Dict, Any, Optional
import pypdf
import docx
import pandas as pd

from app.services.chunking import chunk_text

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB cap
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "csv"}


class IngestionError(Exception):
    pass


def validate_file_metadata(filename: str, file_size: int):
    """Validates file extension and size constraints."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise IngestionError(
            f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if file_size > MAX_FILE_SIZE_BYTES:
        raise IngestionError(
            f"File size exceeds 10MB limit ({file_size / (1024 * 1024):.2f}MB > 10MB)"
        )
    return ext


def extract_from_pdf(content_bytes: bytes) -> List[Dict[str, Any]]:
    """Extracts text page-by-page from a PDF."""
    reader = pypdf.PdfReader(io.BytesIO(content_bytes))
    if len(reader.pages) == 0:
        raise IngestionError("PDF file contains no pages.")

    sections: List[Dict[str, Any]] = []
    total_text_length = 0

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        page_text = page.extract_text() or ""
        total_text_length += len(page_text.strip())
        if page_text.strip():
            sections.append({
                "text": page_text.strip(),
                "location": f"page {page_num}",
            })

    if total_text_length == 0:
        raise IngestionError(
            "Scanned PDF with no text layer detected. Text-based PDF required (OCR out of scope)."
        )

    return sections


def extract_from_docx(content_bytes: bytes) -> List[Dict[str, Any]]:
    """Extracts text paragraph-by-paragraph from a DOCX file, tracking heading sections."""
    doc = docx.Document(io.BytesIO(content_bytes))
    sections: List[Dict[str, Any]] = []
    current_section = "General"
    current_buffer = []

    for idx, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if not text:
            continue

        style_name = p.style.name.lower() if p.style else ""
        if "heading" in style_name or "title" in style_name:
            if current_buffer:
                sections.append({
                    "text": "\n".join(current_buffer),
                    "location": f"section: {current_section}",
                })
                current_buffer = []
            current_section = text
        else:
            current_buffer.append(text)

    if current_buffer:
        sections.append({
            "text": "\n".join(current_buffer),
            "location": f"section: {current_section}",
        })

    # Also extract tables if present
    for t_idx, table in enumerate(doc.tables):
        table_rows = []
        for r in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in r.cells if cell.text.strip())
            if row_text:
                table_rows.append(row_text)
        if table_rows:
            sections.append({
                "text": "\n".join(table_rows),
                "location": f"table {t_idx + 1}",
            })

    if not sections:
        raise IngestionError("DOCX document contains no readable text content.")

    return sections


def extract_from_txt(content_bytes: bytes, lines_per_block: int = 50) -> List[Dict[str, Any]]:
    """Extracts text from TXT by line ranges."""
    text_content = content_bytes.decode("utf-8", errors="replace")
    lines = text_content.splitlines()
    if not any(line.strip() for line in lines):
        raise IngestionError("TXT file contains no text.")

    sections: List[Dict[str, Any]] = []
    for i in range(0, len(lines), lines_per_block):
        block = lines[i : i + lines_per_block]
        block_text = "\n".join(block).strip()
        if block_text:
            start_line = i + 1
            end_line = min(i + lines_per_block, len(lines))
            location = f"line {start_line}" if start_line == end_line else f"lines {start_line}-{end_line}"
            sections.append({"text": block_text, "location": location})

    return sections


def extract_from_csv(content_bytes: bytes, rows_per_chunk: int = 10) -> List[Dict[str, Any]]:
    """Extracts text from CSV by row groups, preserving column headers."""
    text_content = content_bytes.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text_content))
    rows = list(reader)

    if not rows:
        raise IngestionError("CSV file is empty.")

    headers = rows[0]
    data_rows = rows[1:]

    if not data_rows:
        return [{"text": f"Headers: {', '.join(headers)} (empty data)", "location": "headers"}]

    sections: List[Dict[str, Any]] = []
    for i in range(0, len(data_rows), rows_per_chunk):
        group = data_rows[i : i + rows_per_chunk]
        chunk_lines = []
        for row_idx, row in enumerate(group, start=i + 2):  # +2 because header is row 1 (1-indexed)
            row_items = [f"{headers[col_idx]}: {val}" for col_idx, val in enumerate(row) if col_idx < len(headers)]
            chunk_lines.append(f"[Row {row_idx}] " + "; ".join(row_items))

        start_row = i + 2
        end_row = min(i + rows_per_chunk + 1, len(data_rows) + 1)
        location = f"row {start_row}" if start_row == end_row else f"rows {start_row}-{end_row}"

        sections.append({
            "text": "\n".join(chunk_lines),
            "location": location,
        })

    return sections


def ingest_document(
    filename: str,
    content_bytes: bytes,
    chunk_size: int = 1000,
    overlap: int = 100,
) -> List[Dict[str, Any]]:
    """Master ingestion function: validates, extracts text sections, and chunks preserving location."""
    ext = validate_file_metadata(filename, len(content_bytes))

    if ext == "pdf":
        sections = extract_from_pdf(content_bytes)
    elif ext == "docx":
        sections = extract_from_docx(content_bytes)
    elif ext == "txt":
        sections = extract_from_txt(content_bytes)
    elif ext == "csv":
        sections = extract_from_csv(content_bytes)
    else:
        raise IngestionError(f"Unsupported format '{ext}'")

    final_chunks: List[Dict[str, Any]] = []
    for section in sections:
        sub_chunks = chunk_text(
            text=section["text"],
            location=section["location"],
            chunk_size=chunk_size,
            overlap=overlap,
        )
        final_chunks.extend(sub_chunks)

    # Assign sequential index
    for idx, c in enumerate(final_chunks):
        c["idx"] = idx

    return final_chunks
