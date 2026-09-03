import io
import os
from pathlib import Path

from app.config import settings


def detect_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return "pdf"
    if ext in (".docx", ".doc"):
        return "docx"
    if ext in (".txt", ".md"):
        return "txt"
    raise ValueError(f"Unsupported file type: {ext}")


def extract_text(file_bytes: bytes, file_type: str) -> str:
    if file_type == "txt":
        return file_bytes.decode("utf-8", errors="replace")
    if file_type == "pdf":
        return _extract_pdf(file_bytes)
    if file_type == "docx":
        return _extract_docx(file_bytes)
    raise ValueError(f"Unsupported file type: {file_type}")


def _extract_pdf(file_bytes: bytes) -> str:
    import fitz  # pymupdf

    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        if doc.page_count > settings.max_pages:
            raise ValueError(f"PDF exceeds {settings.max_pages} page limit")
        for page in doc:
            text_parts.append(page.get_text())
    text = "\n".join(text_parts).strip()
    if not text:
        return _ocr_pdf(file_bytes)
    return text


def _ocr_pdf(file_bytes: bytes) -> str:
    # ponytail: OCR fallback for scanned PDFs, only when PyMuPDF finds no text layer
    import fitz
    import pytesseract
    from PIL import Image

    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text_parts.append(pytesseract.image_to_string(img))
    return "\n".join(text_parts).strip()


def _extract_docx(file_bytes: bytes) -> str:
    import docx

    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
