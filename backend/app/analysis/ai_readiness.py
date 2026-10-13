import httpx

from app.services.crawler import CrawlResult
from app.utils.config import settings
from urllib.robotparser import RobotFileParser

MONITORED_AI_CRAWLERS = [
    "GPTBot",
    "ClaudeBot",
    "Google-Extended",
    "CCBot",
    "PerplexityBot",
    "Amazonbot",
]


def _fetch_text(client: httpx.Client, url: str) -> tuple[int | None, str | None]:
    try:
        response = client.get(url)
        if response.status_code != 200:
            return response.status_code, None
        return 200, response.text
    except httpx.HTTPError as exc:
        return None, f"{type(exc).__name__}: {exc}"
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"


def _crawler_rule(robots_text: str | None, crawler: str, start_url: str) -> str:
    if not robots_text:
        return "no_robots_txt"
    if crawler.lower() not in robots_text.lower():
        return "not_mentioned"
    parser = RobotFileParser()
    parser.parse(robots_text.splitlines())
    try:
        return "allowed" if parser.can_fetch(crawler, start_url) else "disallowed"
    except Exception:
        return "allowed"


def analyze_site(crawl: CrawlResult, client: httpx.Client) -> dict:
    parts = httpx.URL(crawl.start_url)
    port = parts.port
    base = f"{parts.scheme}://{parts.host}" + (f":{port}" if port and port not in (80, 443) else "")

    llms_status, llms_content = _fetch_text(client, f"{base}/llms.txt")
    sitemap_status, _ = _fetch_text(client, f"{base}/sitemap.xml")

    pages = crawl.successful_pages
    parsed_list = [page.parsed for page in pages if page.parsed is not None]
    pages_count = len(parsed_list)

    structured_data_pages = sum(1 for p in parsed_list if p.json_ld)
    semantic_html_pages = sum(1 for p in parsed_list if len(p.semantic_tags) >= 3)
    meta_description_pages = sum(1 for p in parsed_list if p.meta_description)

    ai_rules = {
        crawler: _crawler_rule(crawl.robots.text, crawler, crawl.start_url)
        for crawler in MONITORED_AI_CRAWLERS
    }

    return {
        "llms_txt_found": llms_status == 200,
        "llms_txt_bytes": len(llms_content.encode("utf-8")) if llms_content else 0,
        "sitemap_xml_found": sitemap_status == 200,
        "sitemaps_in_robots": crawl.robots.sitemaps,
        "robots_txt_found": crawl.robots.fetched,
        "ai_crawler_access": ai_rules,
        "structured_data_pages": structured_data_pages,
        "semantic_html_pages": semantic_html_pages,
        "meta_description_coverage": round(meta_description_pages / pages_count, 2) if pages_count else 0.0,
        "avg_word_count": round(sum(p.word_count for p in parsed_list) / pages_count, 1) if pages_count else 0,
        "pages_crawled": len(crawl.pages),
        "pages_analyzed": pages_count,
        "max_pages_config": settings.MAX_CRAWL_PAGES,
    }
