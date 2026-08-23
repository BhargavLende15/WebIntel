from app.analysis.parser import parse_html


def test_parses_core_metadata():
    from conftest import SAMPLE_HTML

    page = parse_html("https://example.com/", SAMPLE_HTML)

    assert page.title == "Example Site - Home"
    assert page.meta_description.startswith("An example website")
    assert len(page.meta_description) > 50
    assert page.html_lang == "en"
    assert page.viewport == "width=device-width, initial-scale=1.0"
    assert page.canonical == "https://example.com/"
    assert page.charset == "utf-8"
    assert page.theme_color == "#0f172a"


def test_parses_headings_without_skips():
    from conftest import SAMPLE_HTML

    page = parse_html("https://example.com/", SAMPLE_HTML)

    assert page.headings["h1"] == ["Welcome to Example Site"]
    assert page.headings["h2"] == ["Features", "About"]
    assert page.heading_sequence == [1, 2, 2, 3, 3]
    assert page.heading_order_skips == 0


def test_detects_heading_order_skip():
    from conftest import MINIMAL_HTML

    page = parse_html("https://example.com/bad", MINIMAL_HTML)

    assert page.heading_sequence == [1, 3]
    assert page.heading_order_skips == 1


def test_counts_images_and_links():
    from conftest import SAMPLE_HTML

    page = parse_html("https://example.com/", SAMPLE_HTML)

    assert len(page.images) == 2
    assert len(page.links) == 5
    assert page.generic_link_count == 1
    assert any(link.href == "https://external.example.org/page" for link in page.links)


def test_form_label_detection():
    from conftest import SAMPLE_HTML

    page = parse_html("https://example.com/", SAMPLE_HTML)

    assert len(page.forms) == 1
    form = page.forms[0]
    assert form.input_count == 2
    assert form.inputs_missing_label == 1
    assert form.method == "post"


def test_structured_data_and_social_tags():
    from conftest import SAMPLE_HTML

    page = parse_html("https://example.com/", SAMPLE_HTML)

    assert len(page.json_ld) == 1
    assert page.json_ld[0]["@type"] == "WebSite"
    assert page.json_ld_errors == 0
    assert page.og_tags["og:title"] == "Example Site"
    assert page.twitter_tags["twitter:card"] == "summary"
    assert page.touch_icons == ["/apple-touch-icon.png"]
    assert set(page.semantic_tags) >= {"main", "article", "nav", "footer"}


def test_word_count_and_empty_title():
    from conftest import MINIMAL_HTML, SAMPLE_HTML

    good = parse_html("https://example.com/", SAMPLE_HTML)
    bad = parse_html("https://example.com/bad", MINIMAL_HTML)

    assert good.word_count > 300
    assert bad.title is None
    assert bad.html_lang is None
    assert bad.word_count < 10


def test_malformed_html_does_not_crash():
    page = parse_html("https://example.com/broken", "<html><head><title>Broken")

    assert page.parse_error is False
    assert page.title == "Broken"

    empty = parse_html("https://example.com/empty", None)
    assert empty.word_count == 0
