"""Email OTP verification.

In-memory store. ponytail: single-instance only -- OTPs are lost on restart and
don't span multiple uvicorn workers. Swap for a Redis/DB store if you scale out.
Codes expire after OTP_MINUTES and tolerate a few wrong attempts before resend.
"""

import secrets
import time
from threading import Lock

from app.config import settings

MAX_ATTEMPTS = 5

_store: dict[str, dict] = {}
_lock = Lock()


def generate(email: str) -> str:
    email = email.strip().lower()
    code = f"{secrets.randbelow(1_000_000):06d}"
    with _lock:
        _store[email] = {
            "code": code,
            "expires": time.time() + settings.otp_ttl_seconds(),
            "attempts": 0,
        }
    return code


def verify(email: str, code: str) -> bool:
    email = email.strip().lower()
    with _lock:
        entry = _store.get(email)
        if not entry:
            return False
        if time.time() > entry["expires"]:
            _store.pop(email, None)
            return False
        entry["attempts"] += 1
        if entry["attempts"] > MAX_ATTEMPTS:
            _store.pop(email, None)
            return False
        if entry["code"] == code.strip():
            _store.pop(email, None)
            return True
        return False
