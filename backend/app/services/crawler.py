import time
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser

import httpx

from app.analysis.parser import PageData, parse_html
from app.services.fetcher import FetchResult, build_client, fetch_page
from app.utils.config import settings

NON_PAGE_SCHEMES = {"mailto", "tel", "sms", "javascript", "data", "ftp", "file"}

SKIPPED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico", ".bmp",
    ".css", ".js", ".mjs", ".json", ".xml", ".rss", ".atom",
    ".pdf", ".zip", ".gz", ".tar", ".rar", ".7z",
    ".mp3", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".wav", ".ogg",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".csv",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".exe", ".dmg", ".apk", ".msi", ".deb", ".rpm",
}


@dataclass
class RobotsInfo:
    fetched: bool = False
    text: str | None = None
    parser: RobotFileParser | None = None
    sitemaps: list[str] = field(default_factory=list)
    error: str | None = None

    def can_fetch(self, url: str) -> bool:
        if self.parser is None:
            return True
        try:
            return self.parser.can_fetch("*", url)
        except Exception:
            return True


@dataclass
class CrawledPage:
    url: str
    fetch: FetchResult
    parsed: PageData | None = None


@dataclass
class CrawlResult:
    start_url: str
    domain: str
    pages: list[CrawledPage] = field(default_factory=list)
    discovered_count: int = 0
    skipped_by_robots: int = 0
    max_pages_reached: bool = False
    deadline_exceeded: bool = False
    robots: RobotsInfo = field(default_factory=RobotsInfo)
    errors: list[str] = field(default_factory=list)

    @property
    def successful_pages(self) -> list[CrawledPage]:
        return [page for page in self.pages if page.fetch.ok and page.parsed is not None]


def normalize_url(url: str, base: str | None = None) -> str | None:
    try:
        absolute = urljoin(base, url) if base else url
        parts = urlsplit(absolute)
    except Exception:
        return None
    if parts.scheme.lower() in NON_PAGE_SCHEMES or not parts.scheme or not parts.netloc:
        return None
    scheme = parts.scheme.lower()
    netloc = parts.netloc.lower()
    if netloc.endswith(":80") and scheme == "http":
        netloc = netloc[:-3]
    elif netloc.endswith(":443") and scheme == "https":
        netloc = netloc[:-4]
    path = parts.path or "/"
    return urlunsplit((scheme, netloc, path, parts.query, ""))


def is_page_url(url: str) -> bool:
    path = urlsplit(url).path.lower()
    last_segment = path.rsplit("/", 1)[-1]
    dot_index = last_segment.rfind(".")
    if dot_index == -1:
        return True
    extension = last_segment[dot_index:]
    return extension not in SKIPPED_EXTENSIONS


def same_domain(url: str, domain: str) -> bool:
    return urlsplit(url).netloc.lower() == domain


def get_domain(url: str) -> str:
    return urlsplit(url).netloc.lower()


def fetch_robots(client: httpx.Client, start_url: str) -> RobotsInfo:
    parts = urlsplit(start_url)
    robots_url = urlunsplit((parts.scheme, parts.netloc, "/robots.txt", "", ""))
    info = RobotsInfo()
    result = fetch_page(client, robots_url)
    if not result.ok or result.html is None:
        info.error = result.error or f"HTTP {result.status_code}"
        return info
    info.fetched = True
    info.text = result.html
    parser = RobotFileParser()
    try:
        parser.parse(result.html.splitlines())
        info.parser = parser
        sitemaps = parser.site_maps() or []
        info.sitemaps = list(sitemaps)
    except Exception as exc:
        info.error = f"parse error: {exc}"
    return info


def crawl_site(
    start_url: str,
    max_pages: int | None = None,
    client: httpx.Client | None = None,
    robots: RobotsInfo | None = None,
) -> CrawlResult:
    max_pages = max_pages or settings.MAX_CRAWL_PAGES
    deadline = time.monotonic() + settings.CRAWL_MAX_RUNTIME_SECONDS
    owns_client = client is None
    client = client or build_client()
    try:
        return _crawl_site(start_url, max_pages, client, robots, deadline)
    finally:
        if owns_client:
            client.close()


def _crawl_site(start_url, max_pages, client, robots, deadline):
    normalized_start = normalize_url(start_url)
    if normalized_start is None:
        raise ValueError(f"Invalid start URL: {start_url}")

    if robots is None:
        fetch_result = fetch_page(client, normalized_start)
        robots_url_base = fetch_result.final_url or normalized_start
        robots = fetch_robots(client, robots_url_base)
        first_page = CrawledPage(url=normalized_start, fetch=fetch_result)
        if fetch_result.ok:
            parsed = parse_html(first_page.fetch.final_url or normalized_start, fetch_result.html)
            first_page.parsed = parsed
    else:
        first_page = None

    domain = get_domain(normalized_start)
    result = CrawlResult(start_url=start_url, domain=domain)
    result.robots = robots

    queue: list[str] = [normalized_start]
    enqueued: set[str] = {normalized_start}

    if first_page is not None:
        result.pages.append(first_page)
        if first_page.parsed:
            for link in first_page.parsed.links:
                if len(result.pages) >= max_pages and queue:
                    break
                normalized = normalize_url(link.href, base=first_page.fetch.final_url or normalized_start)
                if normalized is None or normalized in enqueued:
                    continue
                if not same_domain(normalized, domain) or not is_page_url(normalized):
                    continue
                enqueued.add(normalized)
                queue.append(normalized)

    while queue and len(result.pages) < max_pages:
        if time.monotonic() > deadline:
            result.deadline_exceeded = True
            break
        url = queue.pop(0)
        if not result.robots.can_fetch(url):
            result.skipped_by_robots += 1
            continue
        fetch_result = fetch_page(client, url)
        page = CrawledPage(url=url, fetch=fetch_result)
        if not fetch_result.ok:
            result.errors.append(f"{url}: {fetch_result.error or f'HTTP {fetch_result.status_code}'}")
            result.pages.append(page)
            continue
        parsed = parse_html(fetch_result.final_url or url, fetch_result.html)
        page.parsed = parsed
        result.pages.append(page)
        for link in parsed.links:
            if len(result.pages) >= max_pages and queue:
                break
            normalized = normalize_url(link.href, base=fetch_result.final_url or url)
            if normalized is None or normalized in enqueued:
                continue
            if not same_domain(normalized, domain) or not is_page_url(normalized):
                continue
            enqueued.add(normalized)
            queue.append(normalized)

    result.discovered_count = len(enqueued)
    result.max_pages_reached = len(result.pages) >= max_pages
    return result
