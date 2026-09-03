from app.services.ai_detection import scan_ai
import app.services.ai_detection as md

# keep public scan_ai for real runs, but tests stub perplexity to avoid torch/transformers


def _fast_scan_ai(text):
    """scan_ai with perplexity stubbed so tests run without torch/transformers."""
    md._perplexity_model = (None, None)  # avoid loading real model

    from app.services.ai_detection import _perplexity_signal

    def fake_perplexity(t):
        return type("S", (), {"score": 0.5, "name": "perplexity", "detail": ""})()

    md._perplexity_signal = fake_perplexity
    from app.services.ai_detection import scan_ai

    return scan_ai(text)


def test_ai_phrase_flagged():
    text = (
        "It is important to note that in today's world we must delve into the "
        "multifaceted landscape and navigate the complexities. Furthermore, "
        "in conclusion, we should leverage a holistic approach to unlock the "
        "potential and streamline robust processes seamlessly."
    )
    result = _fast_scan_ai(text)
    assert result.score > 0.5
    assert len(result.flagged_segments) > 0


def test_plain_human_text_lower_score():
    text = (
        "I bought groceries this morning. The store was crowded, so I waited "
        "in line. My cat knocked over a plant while I was unpacking. Later I "
        "called my sister about dinner plans. She suggested Thai food."
    )
    result = _fast_scan_ai(text)
    assert result.score < 0.8


def test_structural_ai_tells():
    ai_style = (
        "It transformed manufacturing through mechanization. "
        "It restructured the labor market across nations. "
        "It increased the pace of urbanization significantly. "
        "It also gave rise to new social hierarchies. "
        "This period saw unprecedented economic growth. "
        "It fundamentally changed how societies organized work."
    )
    human_style = (
        "Historians often debate the boundaries of the industrial revolution. "
        "Some scholars point to the steam engine as the key catalyst. "
        "Economic data reveals uneven benefits across regions. "
        "Factory workers faced grueling conditions in the early mills."
    )
    from app.services.ai_detection import _burstiness_signal, _stylometric_signal

    ai_s = _stylometric_signal(ai_style).score
    human_s = _stylometric_signal(human_style).score
    ai_b = _burstiness_signal(ai_style).score
    human_b = _burstiness_signal(human_style).score
    assert ai_s > human_s, f"stylometric should rank AI higher: {ai_s} vs {human_s}"
    assert ai_b > human_b, f"burstiness should rank AI higher: {ai_b} vs {human_b}"


def test_signals_present():
    result = _fast_scan_ai("Short signal test text here for checking output structure. Nothing else matters.")
    names = {s.name for s in result.signals}
    # CPU-only signals always present; perplexity only when torch/transformers available
    assert {"burstiness", "ngram", "stylometric"} <= names
