from conftest import MINIMAL_HTML, make_page

from app.analysis import accessibility


def test_accessibility_good_page():
    result = accessibility.analyze_page(make_page("https://example.com/").parsed)

    assert result["html_lang_present"] is True
    assert result["images_total"] == 2
    assert result["images_missing_alt"] == 1
    assert result["form_inputs_total"] == 2
    assert result["form_inputs_missing_label"] == 1
    assert result["iframes_missing_title"] == 1
    assert result["heading_order_skips"] == 0
    assert result["generic_link_texts"] == 1


def test_accessibility_bad_page():
    result = accessibility.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed)

    assert result["html_lang_present"] is False
    assert result["images_missing_alt"] == 1
    assert result["heading_order_skips"] == 1


def test_accessibility_aggregate():
    results = [
        accessibility.analyze_page(make_page("https://example.com/").parsed),
        accessibility.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed),
    ]
    summary = accessibility.aggregate(results)

    assert summary["pages_analyzed"] == 2
    assert summary["pages_missing_html_lang"] == 1
    assert summary["images_missing_alt"] == 2
    assert summary["form_inputs_missing_label"] == 1
    assert summary["iframes_missing_title"] == 1
    assert summary["pages_with_heading_skips"] == 1
    assert summary["generic_link_texts"] == 2
