from conftest import make_page

from app.analysis import performance


def test_performance_page_metrics():
    result = performance.analyze_page(make_page("https://example.com/"))

    assert result["status_code"] == 200
    assert result["ttfb_ms"] == 120.0
    assert result["total_time_ms"] == 300.0
    assert result["compressed"] is False
    assert result["redirected"] is False


def test_performance_compression_and_redirect():
    page = make_page("https://example.com/old", headers={"content-encoding": "gzip"})
    page.fetch.final_url = "https://example.com/new"
    result = performance.analyze_page(page)

    assert result["compressed"] is True
    assert result["content_encoding"] == "gzip"
    assert result["redirected"] is True


def test_performance_aggregate_math():
    first = performance.analyze_page(make_page("https://example.com/a"))
    second = performance.analyze_page(make_page("https://example.com/b"))
    summary = performance.aggregate([first, second])

    assert summary["pages_analyzed"] == 2
    assert summary["avg_ttfb_ms"] == 120.0
    assert summary["max_ttfb_ms"] == 120.0
    assert summary["avg_total_time_ms"] == 300.0
    assert summary["slowest_page"]["url"] in {"https://example.com/a", "https://example.com/b"}
    assert summary["largest_page"]["size_kb"] > 0
    assert "HTTP-level" in summary["note"]


def test_performance_aggregate_empty():
    assert performance.aggregate([]) == {"pages_analyzed": 0}
