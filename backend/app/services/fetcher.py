import ipaddress
import socket
import time
from dataclasses import dataclass, field
from urllib.parse import urlsplit

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
        follow_redirects=False,
        max_redirects=5,
        headers=DEFAULT_HEADERS,
    )


MAX_RESPONSE_BYTES = 2 * 1024 * 1024


def validate_fetch_url(url: str) -> str | None:
    """Reject unsafe URL syntax and literal non-public destinations."""
    try:
        parts = urlsplit(url)
        if parts.scheme.lower() not in {"http", "https"}:
            return "Only HTTP and HTTPS URLs are supported."
        if not parts.hostname or parts.username is not None or parts.password is not None:
            return "URL host is missing or URL credentials are not allowed."
        if any(ord(char) < 32 for char in url):
            return "URL contains invalid control characters."
        host = parts.hostname.lower()
        if host == "localhost" or host.endswith(".localhost"):
            return "Localhost targets are not allowed."
        try:
            address = ipaddress.ip_address(host.strip("[]"))
        except ValueError:
            address = None
        if address is not None and not address.is_global:
            return "Non-public IP addresses are not allowed."
        _ = parts.port
    except (ValueError, TypeError):
        return "Invalid URL."
    return None

def _validate_public_dns(host: str) -> str | None:
    """Reject hostnames that resolve to any non-public IP address."""
    try:
        answers = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except OSError:
        return "Hostname could not be resolved."

    if not answers:
        return "Hostname has no usable address."

    for answer in answers:
        try:
            address = ipaddress.ip_address(answer[4][0])
        except ValueError:
            return "Hostname returned an invalid address."
        if not address.is_global:
            return "Hostname resolves to a non-public IP address."
    return None


def _fetch_page_once(client: httpx.Client, url: str) -> FetchResult:
    """Fetch HTML with bounded bodies and validated manual redirects."""
    current_url = url
    start = time.perf_counter()
    max_redirects = 5
    redirect_statuses = {301, 302, 303, 307, 308}

    for redirect_count in range(max_redirects + 1):
        validation_error = validate_fetch_url(current_url)
        if validation_error:
            return FetchResult(url=url, error=validation_error)

        parts = urlsplit(current_url)
        dns_error = _validate_public_dns(parts.hostname or "")
        if dns_error:
            return FetchResult(url=url, error=dns_error)

        response = None
        try:
            request = client.build_request("GET", current_url)
            request_start = time.perf_counter()
            response = client.send(request, stream=True, follow_redirects=False)
            ttfb_ms = round((time.perf_counter() - request_start) * 1000, 2)

            if response.status_code in redirect_statuses:
                location = response.headers.get("location")
                if not location:
                    return FetchResult(
                        url=url,
                        status_code=response.status_code,
                        error="Redirect response has no Location header.",
                    )
                if redirect_count >= max_redirects:
                    return FetchResult(
                        url=url,
                        status_code=response.status_code,
                        error="Too many redirects.",
                    )
                current_url = str(response.url.join(location))
                continue

            result = FetchResult(url=url)
            result.final_url = str(response.url)
            result.status_code = response.status_code
            result.headers = {k.lower(): v for k, v in response.headers.items()}
            result.content_type = response.headers.get("content-type", "")

            if "text/html" not in result.content_type and "application/xhtml" not in result.content_type:
                result.error = f"unsupported content type: {result.content_type or 'unknown'}"
                return result

            content = bytearray()
            for chunk in response.iter_bytes():
                content.extend(chunk)
                if len(content) > MAX_RESPONSE_BYTES:
                    result.error = f"Response exceeds the {MAX_RESPONSE_BYTES}-byte limit."
                    return result

            result.ttfb_ms = ttfb_ms
            result.total_time_ms = round((time.perf_counter() - start) * 1000, 2)
            result.size_bytes = len(content)
            encoding = response.encoding or "utf-8"
            try:
                result.html = bytes(content).decode(encoding, errors="replace")
            except LookupError:
                result.html = bytes(content).decode("utf-8", errors="replace")
            return result
        except httpx.HTTPError as exc:
            return FetchResult(url=url, error=f"{type(exc).__name__}: {exc}")
        except Exception as exc:
            return FetchResult(url=url, error=f"{type(exc).__name__}: {exc}")
        finally:
            if response is not None:
                response.close()

    return FetchResult(url=url, error="Too many redirects.")


def fetch_page(client: httpx.Client, url: str) -> FetchResult:
    """Retry a page once after transient network failures."""
    transient_errors = {
        "ReadTimeout",
        "ConnectTimeout",
        "WriteTimeout",
        "PoolTimeout",
        "TimeoutException",
        "ConnectError",
        "ReadError",
        "WriteError",
        "RemoteProtocolError",
    }

    result = _fetch_page_once(client, url)
    error_type = (result.error or "").split(":", 1)[0]

    if error_type not in transient_errors:
        return result

    time.sleep(0.25)
    retry_result = _fetch_page_once(client, url)

    return retry_result
