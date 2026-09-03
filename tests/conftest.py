import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def sample_pdf():
    import fitz

    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "The quick brown fox jumps over the lazy dog. Academic honesty matters.")
    doc.save(tmp.name)
    doc.close()
    with open(tmp.name, "rb") as f:
        data = f.read()
    os.unlink(tmp.name)
    return data


@pytest.fixture
def sample_docx():
    import docx
    from io import BytesIO

    d = docx.Document()
    d.add_paragraph("This is a test document for plagiarism detection.")
    buf = BytesIO()
    d.save(buf)
    return buf.getvalue()
