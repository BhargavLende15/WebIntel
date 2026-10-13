from conftest import MINIMAL_HTML, SAMPLE_HTML, make_page

from app.analysis import mobile


def test_mobile_responsive_viewport():
    result = mobile.analyze_page(make_page("https://example.com/").parsed)

    assert result["viewport_present"] is True
    assert result["viewport_responsive"] is True
    assert result["theme_color_present"] is True
    assert result["apple_touch_icon_present"] is True
    assert result["charset_present"] is True


def test_mobile_missing_viewport():
    result = mobile.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed)

    assert result["viewport_present"] is False
    assert result["viewport_responsive"] is False


def test_mobile_fixed_width_viewport_is_not_responsive():
    html = SAMPLE_HTML.replace(
        'content="width=device-width, initial-scale=1.0"',
        'content="width=1024"',
    )
    result = mobile.analyze_page(make_page("https://example.com/fixed", html).parsed)

    assert result["viewport_present"] is True
    assert result["viewport_responsive"] is False


def test_mobile_aggregate():
    results = [
        mobile.analyze_page(make_page("https://example.com/").parsed),
        mobile.analyze_page(make_page("https://example.com/bad", MINIMAL_HTML).parsed),
    ]
    summary = mobile.aggregate(results)

    assert summary["pages_analyzed"] == 2
    assert summary["viewport_missing_pages"] == 1
    assert summary["non_responsive_viewport_pages"] == 0
    assert summary["apple_touch_icon_pages"] == 1
