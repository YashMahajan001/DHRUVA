import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("backend.access")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000.0

        # Don't clutter logs for static or high-frequency polling unless error
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({process_time_ms:.1f}ms)"
        )
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        return response
