import app.services.plagiarism as mp


def _stub_semantic():
    """Stub SBERT so plagiarism tests run without torch/sentence-transformers."""
    mp._st_model = object()  # mark as loaded

    def fake_semantic(text_a, refs):
        return [0.0] * len(refs) if refs else []

    mp._semantic_similarity = fake_semantic


def test_directory_plagiarism_from_reference():
    _stub_semantic()
    original = (
        "The industrial revolution transformed society by mechanizing production "
        "and restructuring labor markets across Europe and North America."
    )
    copied = (
        "The industrial revolution transformed society by mechanizing production "
        "and restructuring labor markets across Europe and North America."
    )
    result = mp.scan_plagiarism(copied, [original])
    assert result.score > 0.8
    assert any(m.match_type == "reference" or m.match_type == "paraphrase" for m in result.matches)


def test_distinct_text_low_score():
    _stub_semantic()
    a = "Quantum entanglement links particles regardless of spatial separation."
    b = "Banana bread is best served warm with butter and a cup of coffee."
    result = mp.scan_plagiarism(a, [b])
    assert result.score < 0.5


def test_paraphrase_detected():
    # paraphrase detection needs real embedding similarity; stub low to focus on TF-IDF only
    _stub_semantic()
    original = "Climate change causes rising sea levels and extreme weather events."
    paraphrase = "Rising sea levels and extreme weather events are caused by climate change."
    result = mp.scan_plagiarism(paraphrase, [original])
    assert result.score > 0.5
