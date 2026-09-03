from app.services.extractors import detect_file_type, extract_text


def test_detect_type():
    assert detect_file_type("x.pdf") == "pdf"
    assert detect_file_type("x.docx") == "docx"
    assert detect_file_type("x.txt") == "txt"
    assert detect_file_type("x.md") == "txt"


def test_extract_txt():
    text = extract_text(b"hello world", "txt")
    assert text == "hello world"


def test_extract_pdf(sample_pdf):
    text = extract_text(sample_pdf, "pdf")
    assert "quick brown fox" in text


def test_extract_docx(sample_docx):
    text = extract_text(sample_docx, "docx")
    assert "test document" in text.lower()
