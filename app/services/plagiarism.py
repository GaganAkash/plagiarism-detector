from dataclasses import dataclass, field

import spacy

from app.services.preprocessing import chunk_text

nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])

_st_model = None


def _get_st_model():
    global _st_model
    if _st_model is None:
        try:
            from sentence_transformers import SentenceTransformer

            _st_model = SentenceTransformer("all-MiniLM-L6-v2")
        except (ImportError, OSError):
            # ponytail: SBERT (needs torch) optional; TF-IDF still covers exact reuse.
            return None
    return _st_model


@dataclass
class Match:
    text: str
    score: float
    source: str
    match_type: str  # reference | web | paraphrase


@dataclass
class PlagiarismResult:
    score: float
    matches: list = field(default_factory=list)


def scan_plagiarism(text: str, reference_docs: list[str] | None = None) -> PlagiarismResult:
    matches = []
    chunk_scores = []

    if reference_docs:
        for ref in reference_docs:
            score = _tfidf_similarity(text, ref)
            if score > 0.5:
                matches.append(Match(text=_top_match_excerpt(text, ref), score=score, source="reference", match_type="reference"))
                chunk_scores.append(score)

    semantic_scores = _semantic_similarity(text, reference_docs or [])
    for i, score in enumerate(semantic_scores):
        if score > 0.65 and reference_docs:
            matches.append(Match(text=_top_match_excerpt_embed(text, reference_docs[i]), score=score, source="reference", match_type="paraphrase"))
            chunk_scores.append(score)

    score = min(1.0, sum(chunk_scores) / len(chunk_scores)) if chunk_scores else 0.0
    matches.sort(key=lambda m: m.score, reverse=True)
    return PlagiarismResult(score=round(score, 3), matches=matches[:10])


def _tfidf_similarity(text_a: str, text_b: str) -> float:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    vec = TfidfVectorizer(stop_words="english")
    try:
        matrix = vec.fit_transform([text_a, text_b])
    except ValueError:
        return 0.0
    return float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])


def _semantic_similarity(text_a: str, refs: list[str]) -> list[float]:
    if not refs:
        return []
    model = _get_st_model()
    if model is None:
        return []
    emb_a = model.encode([text_a])
    ref_embs = model.encode(refs)
    from sklearn.metrics.pairwise import cosine_similarity

    return [float(cosine_similarity(emb_a, [re])[0][0]) for re in ref_embs]


def _top_match_excerpt(text_a: str, text_b: str) -> str:
    a_tokens = {t.lemma_ for t in nlp(text_a.lower()) if t.is_alpha}
    b_sentences = chunk_text(text_b)
    best, best_score = "", 0.0
    for sent in b_sentences:
        b_tokens = {t.lemma_ for t in nlp(sent.lower()) if t.is_alpha}
        if not a_tokens and not b_tokens:
            continue
        jac = len(a_tokens & b_tokens) / max(1, len(a_tokens | b_tokens))
        if jac > best_score:
            best, best_score = sent, jac
    return best[:300] if best else text_a[:200]


def _top_match_excerpt_embed(text_a: str, ref: str) -> str:
    model = _get_st_model()
    chunks = chunk_text(ref)
    if not chunks:
        return text_a[:200]
    embs = model.encode(chunks)
    from sklearn.metrics.pairwise import cosine_similarity

    emb_a = model.encode([text_a])
    sims = cosine_similarity(emb_a, embs)[0]
    best_idx = sims.argmax()
    return chunks[best_idx][:300]
