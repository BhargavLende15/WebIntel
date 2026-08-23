from app.services.crawler import CrawledPage

SECURITY_HEADERS = [
    "strict-transport-security",
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
]


def analyze_page(page: CrawledPage) -> dict:
    fetch = page.fetch
    headers = fetch.headers
    is_https = (fetch.final_url or fetch.url).lower().startswith("https://")
    set_cookie = headers.get("set-cookie", "")
    return {
        "url": page.url,
        "is_https": is_https,
        "headers_present": {header: header in headers for header in SECURITY_HEADERS},
        "server_header_disclosed": bool(headers.get("server")),
        "cookies_secure": all("secure" in cookie.lower() for cookie in set_cookie.split(",")) if set_cookie else None,
    }


def aggregate(results: list[dict]) -> dict:
    pages = len(results)
    if pages == 0:
        return {"pages_analyzed": 0}
    header_counts = {
        header: sum(1 for r in results if r["headers_present"].get(header))
        for header in SECURITY_HEADERS
    }
    homepage = results[0]
    return {
        "pages_analyzed": pages,
        "https_pages": sum(1 for r in results if r["is_https"]),
        "http_only_pages": sum(1 for r in results if not r["is_https"]),
        "header_coverage": {header: {"pages": count, "ratio": round(count / pages, 2)} for header, count in header_counts.items()},
        "homepage_https": homepage["is_https"],
        "server_header_disclosed_pages": sum(1 for r in results if r["server_header_disclosed"]),
        "pages": results,
    }
