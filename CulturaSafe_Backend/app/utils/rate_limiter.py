"""In-memory rate limiter for general API routes and authentication endpoints."""

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request
from app.core.security import AppException
from app.core.config import settings


class InMemoryRateLimiter:
    def __init__(self, window_seconds: float, max_requests: int, error_code: str, error_message: str):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.error_code = error_code
        self.error_message = error_message
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = time.time()
        cutoff = now - self.window_seconds
        timestamps = [ts for ts in self._requests[key] if ts > cutoff]
        if len(timestamps) >= self.max_requests:
            self._requests[key] = timestamps
            raise AppException(
                status_code=429,
                code=self.error_code,
                message=self.error_message
            )
        timestamps.append(now)
        self._requests[key] = timestamps

    def reset(self) -> None:
        self._requests.clear()


# General API rate limiter (15 min window, 200 requests)
api_limiter = InMemoryRateLimiter(
    window_seconds=settings.RATE_LIMIT_WINDOW_MS / 1000.0,
    max_requests=settings.RATE_LIMIT_MAX_REQUESTS,
    error_code="TOO_MANY_REQUESTS",
    error_message="Too many requests from this IP address. Please try again after 15 minutes."
)

# Authentication endpoints rate limiter (15 min window, 20 attempts)
auth_limiter = InMemoryRateLimiter(
    window_seconds=15 * 60,
    max_requests=settings.AUTH_RATE_LIMIT_MAX,
    error_code="AUTH_RATE_LIMIT_EXCEEDED",
    error_message="Too many authentication attempts. Please try again later."
)


def limit_auth_requests(request: Request) -> None:
    client_ip = request.client.host if request.client else "127.0.0.1"
    auth_limiter.check(client_ip)
