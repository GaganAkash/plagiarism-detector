import spacy

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def chunk_text(text: str, max_len: int = 500) -> list[str]:
    """Split text into sentence-chunks, recombining short sentences up to max_len chars."""
    nlp = get_nlp()
    doc = nlp(text.replace("\n", " "))
    chunks, current = [], ""
    for sent in doc.sents:
        s = sent.text.strip()
        if not s:
            continue
        if len(current) + len(s) > max_len and current:
            chunks.append(current.strip())
            current = s
        else:
            current += " " + s
    if current.strip():
        chunks.append(current.strip())
    return chunks


def tokenize_lemmas(text: str) -> list[str]:
    nlp = get_nlp()
    doc = nlp(text.lower())
    return [t.lemma_ for t in doc if t.is_alpha and not t.is_stop]
