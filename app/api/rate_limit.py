"""Minimal in-memory sliding-window rate limiter (per client IP).

Matches slowapi/fastapi-limiter for a single-instance deploy without the
dependency. ponytail: in-memory only -- not accurate across multiple uvicorn
workers. If you scale past one worker, swap for a Redis-backed limiter.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request

_buckets: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def rate_limit(limit: int, window: int = 60):
    def dependency(request: Request):
        key = request.client.host if request.client else "unknown"
        now = time.monotonic()
        with _lock:
            q = _buckets[key]
            while q and q[0] <= now - window:
                q.popleft()
            if len(q) >= limit:
                raise HTTPException(status_code=429, detail="Too many requests, slow down")
            q.append(now)

    return dependency
