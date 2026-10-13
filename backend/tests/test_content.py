from conftest import MINIMAL_HTML, make_page

from app.analysis import content


def test_content_good_page_not_thin():
    result = content.analyze_page(make_page("https://example.com/").parsed)

    assert result["word_count"] > 300
    assert result["thin_content"] is False
    assert result["paragraph_count"] >= 3
    assert 0 < result["text_html_ratio"] < 1


def test_content_thin_page():
    result = content.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed)

    assert result["word_count"] < 300
    assert result["thin_content"] is True


def test_content_aggregate_and_duplicates():
    first = content.analyze_page(make_page("https://example.com/").parsed)
    duplicate = content.analyze_page(make_page("https://example.com/copy/").parsed)
    thin = content.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed)
    summary = content.aggregate([first, duplicate, thin])

    assert summary["pages_analyzed"] == 3
    assert summary["thin_content_pages"] == 1
    assert summary["duplicate_titles"] == 1
    assert summary["duplicate_meta_descriptions"] == 1
    assert summary["min_word_count"] < summary["max_word_count"]
