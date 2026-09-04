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


def test_aggregate_score_no_matches_is_zero():
    assert mp.aggregate_score([]) == 0.0


def test_web_matches_count_toward_score_with_no_reference_docs():
    # Regression: web matches were appended to the match list but never affected the
    # score. A doc with web matches and zero reference docs now reports a real score.
    from app.services.plagiarism import Match

    web_matches = [
        Match(text="snippet a", score=0.9, source="https://example.com/a", match_type="web"),
        Match(text="snippet b", score=0.7, source="https://example.com/b", match_type="web"),
    ]
    result = mp.scan_plagiarism("A genuinely novel essay with no reference corpus.", [])
    result.matches.extend(web_matches)
    combined = mp.aggregate_score(result.matches)
    assert combined > 0.5  # undiluted by zero-score reference path
    assert combined == round((0.9 + 0.7) / 2, 3)
