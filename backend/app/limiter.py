import time
from collections import defaultdict

from fastapi import HTTPException

_hits: dict[str, list[float]] = defaultdict(list)


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    now = time.time()
    recent = [stamp for stamp in _hits[key] if now - stamp < window_seconds]
    if len(recent) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests. Wait a moment and try again.")
    recent.append(now)
    _hits[key] = recent
