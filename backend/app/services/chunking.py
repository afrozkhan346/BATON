from typing import List, Dict, Any
import uuid


def chunk_text(
    text: str,
    location: str,
    chunk_size: int = 1000,
    overlap: int = 100,
) -> List[Dict[str, Any]]:
    """Chunks text into sliding windows while preserving source location tags.
    Chunk size target: 800 - 1200 characters with overlap.
    """
    clean_text = text.strip()
    if not clean_text:
        return []

    # If text is smaller than chunk size, return single chunk
    if len(clean_text) <= chunk_size:
        return [{"text": clean_text, "location": location}]

    chunks: List[Dict[str, Any]] = []
    start = 0
    total_len = len(clean_text)

    while start < total_len:
        end = start + chunk_size

        if end >= total_len:
            chunk_slice = clean_text[start:]
            if chunk_slice.strip():
                chunks.append({"text": chunk_slice.strip(), "location": location})
            break

        # Try to find a clean break (newline or period or space) near end
        cutoff = end
        for sep in ["\n\n", "\n", ". ", " "]:
            last_sep = clean_text.rfind(sep, start + chunk_size // 2, end)
            if last_sep != -1:
                cutoff = last_sep + len(sep)
                break

        chunk_slice = clean_text[start:cutoff].strip()
        if chunk_slice:
            chunks.append({"text": chunk_slice, "location": location})

        # Advance start with overlap
        start = max(start + 1, cutoff - overlap)

    return chunks
