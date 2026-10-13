import os

os.environ.setdefault("DATABASE_URL", "postgresql://webintel:webintel@localhost:5432/webintel")

import pytest
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

from app.analysis.parser import parse_html
from app.services.crawler import CrawledPage, CrawlResult, RobotsInfo
from app.services.fetcher import FetchResult

FILLER_WORDS = " ".join(["content"] * 340)

SAMPLE_HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Example Site - Home</title>
<meta name="description" content="An example website used to verify the WebIntel analysis pipeline end to end.">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0f172a">
<meta property="og:title" content="Example Site">
<meta property="og:description" content="Example description">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="https://example.com/">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebSite","name":"Example"}}</script>
</head>
<body>
<nav><a href="/">Home</a></nav>
<main>
<article>
<h1>Welcome to Example Site</h1>
<p>{FILLER_WORDS}</p>
<h2>Features</h2>
<p>Second paragraph with some words.</p>
<h3>Fast</h3>
<h3>Simple</h3>
<img src="/hero.png" alt="Hero banner">
<img src="/chart.png">
<section><h2>About</h2><p>About this site.</p></section>
<a href="/about">About page</a>
<a href="https://external.example.org/page">External reference</a>
<a href="/docs/readme.pdf">Download PDF</a>
<a href="#">click here</a>
<form action="/subscribe" method="post">
<label for="email">Email</label>
<input id="email" type="text" name="email">
<input type="text" name="phone">
<input type="hidden" name="csrf" value="x">
<button type="submit">Subscribe</button>
</form>
<iframe src="https://player.example.com"></iframe>
<footer><p>Footer text.</p></footer>
</article>
</main>
</body>
</html>"""

MINIMAL_HTML = """<html><head><title></title></head><body><h1>Hi</h1><h3>Jump</h3><img src="x.png"><a href="#">click here</a><p>Short.</p></body></html>"""


def make_fetch(url: str, html: str = SAMPLE_HTML, status_code: int = 200, headers: dict | None = None) -> FetchResult:
    return FetchResult(
        url=url,
        final_url=url,
        status_code=status_code,
        headers=headers or {},
        html=html,
        content_type="text/html",
        ttfb_ms=120.0,
        total_time_ms=300.0,
        size_bytes=len(html.encode("utf-8")),
    )


def make_page(url: str, html: str = SAMPLE_HTML, headers: dict | None = None) -> CrawledPage:
    fetch = make_fetch(url, html, headers=headers)
    return CrawledPage(url=url, fetch=fetch, parsed=parse_html(url, html))


def make_crawl_result(start_url: str = "https://example.com/", pages: list[CrawledPage] | None = None) -> CrawlResult:
    pages = pages if pages is not None else [make_page(start_url)]
    return CrawlResult(
        start_url=start_url,
        domain=urlsplit(start_url).netloc.lower(),
        pages=pages,
        discovered_count=len(pages),
    )


def make_robots(text: str) -> RobotsInfo:
    parser = RobotFileParser()
    parser.parse(text.splitlines())
    sitemaps = parser.site_maps() or []
    return RobotsInfo(fetched=True, text=text, parser=parser, sitemaps=list(sitemaps))


@pytest.fixture(scope="session")
def requires_db():
    from sqlalchemy import text

    from app.database.session import engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        pytest.skip("PostgreSQL is not available for integration tests")
