from app.services.crawler import CrawledPage


def analyze_page(page: CrawledPage) -> dict:
    fetch = page.fetch
    encoding = fetch.headers.get("content-encoding", "")
    final_url = fetch.final_url or fetch.url
    return {
        "url": page.url,
        "status_code": fetch.status_code,
        "ttfb_ms": fetch.ttfb_ms,
        "total_time_ms": fetch.total_time_ms,
        "size_bytes": fetch.size_bytes,
        "compressed": bool(encoding),
        "content_encoding": encoding or None,
        "redirected": final_url.rstrip("/") != page.url.rstrip("/"),
    }


def _kb(size_bytes: int) -> float:
    return round(size_bytes / 1024, 1)


def aggregate(results: list[dict]) -> dict:
    pages = len(results)
    if pages == 0:
        return {"pages_analyzed": 0}
    ttfbs = [r["ttfb_ms"] for r in results if r["ttfb_ms"] is not None]
    totals = [r["total_time_ms"] for r in results if r["total_time_ms"] is not None]
    sizes = [r["size_bytes"] for r in results if r["size_bytes"]]
    slowest = max(results, key=lambda r: r["total_time_ms"] or 0)
    largest = max(results, key=lambda r: r["size_bytes"])
    return {
        "pages_analyzed": pages,
        "avg_ttfb_ms": round(sum(ttfbs) / len(ttfbs), 1) if ttfbs else None,
        "max_ttfb_ms": round(max(ttfbs), 1) if ttfbs else None,
        "avg_total_time_ms": round(sum(totals) / len(totals), 1) if totals else None,
        "avg_page_size_kb": _kb(round(sum(sizes) / len(sizes))) if sizes else 0,
        "largest_page": {"url": largest["url"], "size_kb": _kb(largest["size_bytes"])} if sizes else None,
        "slowest_page": {"url": slowest["url"], "total_time_ms": slowest["total_time_ms"]},
        "compressed_pages": sum(1 for r in results if r["compressed"]),
        "redirected_pages": sum(1 for r in results if r["redirected"]),
        "note": "HTTP-level timing signals only; browser-rendered metrics require a later phase",
        "pages": results,
    }
