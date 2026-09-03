import httpx

from app.config import settings
from app.services.preprocessing import chunk_text
from app.services.plagiarism import Match


def search_web(text: str, max_chunks: int = 30) -> list[Match]:
    """Query Bing search with sentence-chunks, return overlapping matches."""
    if not settings.bing_api_key:
        return []
    chunks = chunk_text(text)[:max_chunks]
    matches = []
    for chunk in chunks:
        snippet, url, score = _bing_search(chunk)
        if score > 0.4:
            matches.append(Match(text=snippet, score=score, source=url, match_type="web"))
    return matches


def _bing_search(chunk: str, max_tokens: int = 200) -> tuple[str, str, float]:
    query = " ".join(chunk.split()[:max_tokens])
    headers = {"Ocp-Apim-Subscription-Key": settings.bing_api_key}
    params = {"q": query, "count": "3", "textDecorations": "false"}
    try:
        r = httpx.get(
            "https://api.bing.microsoft.com/v7.0/search",
            headers=headers,
            params=params,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception:
        return "", "", 0.0

    matched, best_url, best_score = "", "", 0.0
    for result in data.get("webPages", {}).get("value", []):
        url = result.get("url", "")
        snippet = result.get("snippet", "")
        score = _overlap_score(chunk, snippet)
        if score > best_score:
            best_score = score
            best_url = url
            matched = snippet
    return matched, best_url, best_score


def _overlap_score(chunk: str, snippet: str) -> float:
    a = set(chunk.lower().split())
    b = set(snippet.lower().split())
    if not a or not b:
        return 0.0
    return len(a & b) / len(a)
