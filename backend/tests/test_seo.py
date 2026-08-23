from conftest import MINIMAL_HTML, make_page

from app.analysis import seo


def test_seo_page_metrics_good_page():
    result = seo.analyze_page(make_page("https://example.com/").parsed)

    assert result["title_present"] is True
    assert result["title_length"] == len("Example Site - Home")
    assert result["meta_description_present"] is True
    assert result["h1_count"] == 1
    assert result["canonical_present"] is True
    assert result["robots_noindex"] is False
    assert result["open_graph_tags"] == 2
    assert result["images_total"] == 2
    assert result["images_missing_alt"] == 1


def test_seo_page_metrics_bad_page():
    result = seo.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed)

    assert result["title_present"] is False
    assert result["meta_description_present"] is False
    assert result["canonical_present"] is False


def test_seo_noindex_detection():
    html = MINIMAL_HTML.replace("<head>", "<head><meta name='robots' content='noindex, follow'>")
    result = seo.analyze_page(make_page("https://example.com/noindex", html).parsed)

    assert result["robots_noindex"] is True


def test_seo_aggregate():
    results = [
        seo.analyze_page(make_page("https://example.com/").parsed),
        seo.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed),
    ]
    summary = seo.aggregate(results)

    assert summary["pages_analyzed"] == 2
    assert summary["missing_title_pages"] == 1
    assert summary["missing_meta_description_pages"] == 1
    assert summary["multiple_h1_pages"] == 0
    assert summary["images_total"] == 3
    assert summary["images_missing_alt"] == 2
    assert len(summary["pages"]) == 2
