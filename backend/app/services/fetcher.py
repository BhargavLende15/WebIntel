import time
from dataclasses import dataclass, field

import httpx

from app.utils.config import settings

DEFAULT_HEADERS = {
    "User-Agent": settings.USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class FetchResult:
    url: str
    final_url: str | None = None
    status_code: int | None = None
    headers: dict[str, str] = field(default_factory=dict)
    html: str | None = None
    content_type: str | None = None
    ttfb_ms: float | None = None
    total_time_ms: float | None = None
    size_bytes: int = 0
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None and self.status_code is not None and 200 <= self.status_code < 400


def build_client() -> httpx.Client:
    return httpx.Client(
        timeout=settings.FETCH_TIMEOUT_SECONDS,
        follow_redirects=True,
        max_redirects=5,
        headers=DEFAULT_HEADERS,
    )


def fetch_page(client: httpx.Client, url: str) -> FetchResult:
    result = FetchResult(url=url)
    try:
        request = client.build_request("GET", url)
        start = time.perf_counter()
        response = client.send(request, stream=True)
        result.ttfb_ms = round((time.perf_counter() - start) * 1000, 2)
        result.final_url = str(response.url)
        result.status_code = response.status_code
        result.headers = {k.lower(): v for k, v in response.headers.items()}
        result.content_type = response.headers.get("content-type", "")
        if "text/html" not in result.content_type and "application/xhtml" not in result.content_type:
            result.error = f"unsupported content type: {result.content_type or 'unknown'}"
            response.close()
            return result
        content = response.read()
        response.close()
        result.total_time_ms = round((time.perf_counter() - start) * 1000, 2)
        result.size_bytes = len(content)
        encoding = response.encoding or "utf-8"
        try:
            result.html = content.decode(encoding, errors="replace")
        except LookupError:
            result.html = content.decode("utf-8", errors="replace")
    except httpx.HTTPError as exc:
        result.error = f"{type(exc).__name__}: {exc}"
    except Exception as exc:
        result.error = f"{type(exc).__name__}: {exc}"
    return result
