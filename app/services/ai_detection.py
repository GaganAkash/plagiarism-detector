import math
import re
from dataclasses import dataclass, field

from app.services.preprocessing import get_nlp

AI_PHRASES = [
    "delve into", "tapestry", "it is important to note", "in today's world",
    "furthermore", "moreover", "in conclusion", "navigate the complexities",
    "unlock the potential", "in the ever-evolving", "landscape of",
    "play a crucial role", "a testament to", "dive into", "multifaceted",
    "underscore", "intricate", "nuanced", "holistic approach", "leverage",
    "seamlessly", "robust", "streamline", "revolutionize", "game-changer",
]

_perplexity_model = None


def _get_perplexity_model():
    global _perplexity_model
    if _perplexity_model is None:
        from transformers import GPT2LMHeadModel, GPT2TokenizerFast

        _perplexity_model = (
            GPT2LMHeadModel.from_pretrained("gpt2"),
            GPT2TokenizerFast.from_pretrained("gpt2"),
        )
    return _perplexity_model


@dataclass
class Signal:
    name: str
    score: float  # 0 = human-like, 1 = AI-like
    detail: str = ""


@dataclass
class AIDetectionResult:
    score: float
    signals: list = field(default_factory=list)
    flagged_segments: list = field(default_factory=list)
    # calibrated thresholds: human ~<0.3, inconclusive seatbelt ~0.375, AI ~>0.55
    @property
    def classification(self) -> str:
        if self.score >= 0.55:
            return "likely_ai"
        if self.score >= 0.3:
            return "inconclusive"
        return "likely_human"


def scan_ai(text: str) -> AIDetectionResult:
    signals = [
        _burstiness_signal(text),
        _ngram_repeat_signal(text),
        _stylometric_signal(text),
    ]
    # ponytail: perplexity (GPT-2/torch) is opt-in; unavailable on some platforms.
    # Re-weight over available signals.
    base_w = {"burstiness": 0.25, "ngram": 0.15, "stylometric": 0.2}
    if _perplexity_available():
        base_w["perplexity"] = 0.4
        signals.insert(0, _perplexity_signal(text))
    total = sum(base_w.values())
    weights = {k: v / total for k, v in base_w.items()}
    score = sum(s.score * weights.get(s.name, 0) for s in signals)
    flagged = _flag_segments(text)
    return AIDetectionResult(score=round(score, 3), signals=signals, flagged_segments=flagged)


def _perplexity_available() -> bool:
    # ponytail: 0.4 simplex probe, single map lookup
    try:
        import transformers  # noqa: F401
        import torch  # noqa: F401

        return True
    except ImportError:
        return False


def _perplexity_signal(text: str) -> Signal:
    model, tokenizer = _get_perplexity_model()
    tokens = tokenizer.encode(text, truncation=True, max_length=512)
    if len(tokens) < 20:
        return Signal("perplexity", 0.5, "insufficient text")

    import torch

    input_ids = torch.tensor([tokens])
    with torch.no_grad():
        outputs = model(input_ids, labels=input_ids)
        loss = outputs.loss.item()
    # Normalize: loss ~2.5 (perplexity ~12) is very low (AI-like) → high score.
    # loss ~5.5 (perplexity ~250) human-like → low score.
    score = 1.0 - max(0.0, min(1.0, (loss - 2.5) / 3.0))
    return Signal("perplexity", round(score, 3), f"cross-entropy={loss:.2f}")


def _burstiness_signal(text: str) -> Signal:
    nlp = get_nlp()
    doc = nlp(text)
    lengths = [len(sent) for sent in doc.sents if len(sent) > 2]
    if len(lengths) < 5:
        return Signal("burstiness", 0.5, "insufficient sentences")
    mean = sum(lengths) / len(lengths)
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    coef = (variance**0.5) / max(mean, 1e-9)
    # AI text is flatter (low burstiness) → low cv → high AI score.
    score = 1.0 - max(0.0, min(1.0, coef / 0.6))
    return Signal("burstiness", round(score, 3), f"cv={coef:.2f}")


def _ngram_repeat_signal(text: str) -> Signal:
    lowered = text.lower()
    hits = sum(1 for phrase in AI_PHRASES if phrase in lowered)
    hits = min(hits, 10)
    score = hits / 10.0
    return Signal("ngram", round(score, 3), f"{hits} ai-phrases")


def _stylometric_signal(text: str) -> Signal:
    nlp = get_nlp()
    doc = nlp(text)

    # ponytail: AI text recycles the SAME sentence opener. Measure how often the
    # single most common first word leads sentences; require a majority for a
    # common word (pronoun like "The"/"I") so normal varied prose isn't flagged,
    # but ANY verbatim multi-word opener repeat is immediately suspicious.
    openers = []
    for sent in doc.sents:
        words = [t.text.lower() for t in sent if not t.is_space]
        if words:
            openers.append(words)

    if len(openers) < 6:
        return Signal("stylometric", 0.5, "insufficient sentences")

    from collections import Counter

    first = Counter(o[0] for o in openers)
    first_word, first_share = first.most_common(1)[0]
    first_share /= len(openers)

    multi = Counter(tuple(o[:2]) for o in openers if len(o) >= 2)
    _, multi_share = multi.most_common(1)[0]
    multi_share /= len(openers)

    # single common starter is a tell only if it dominates; multi-word repeat is a tell regardless
    common = first_word in {"the", "it", "i", "we", "they", "he", "she", "this", "there", "in", "a"}
    score = (first_share if (first_share >= 0.6 and common) else 0.0) or multi_share
    score = max(0.0, min(1.0, score))
    return Signal("stylometric", round(score, 3), f"top opener '{first_word}' {first_share:.0%}")


def _flag_segments(text: str) -> list[str]:
    lowered = text.lower()
    flagged = []
    for phrase in AI_PHRASES:
        if phrase in lowered:
            idx = lowered.find(phrase)
            start = max(0, idx - 100)
            end = min(len(text), idx + 150)
            flagged.append(text[start:end].strip())
    return flagged[:5]
