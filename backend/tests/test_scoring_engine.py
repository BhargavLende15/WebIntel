from types import SimpleNamespace

import pytest

from app.scoring.engine import (
    calculate_score,
    score_accessibility,
    score_ai_readiness,
    score_security,
)


def make_analysis(**overrides):
    data = {
        "status": "completed",
        "performance_data": {
            "pages_analyzed": 4,
            "avg_ttfb_ms": 200,
            "avg_total_time_ms": 400,
            "avg_page_size_kb": 200,
        },
        "seo_data": {
            "pages_analyzed": 4,
            "missing_title_pages": 0,
            "missing_meta_description_pages": 0,
            "multiple_h1_pages": 0,
            "noindex_pages": 0,
            "missing_canonical_pages": 0,
        },
        "accessibility_data": {
            "pages_analyzed": 4,
            "images_total": 20,
            "images_missing_alt": 2,
            "form_inputs_total": 4,
            "form_inputs_missing_label": 1,
            "pages_missing_html_lang": 0,
        },
        "security_data": {
            "pages_analyzed": 4,
            "https_pages": 4,
            "header_coverage": {
                "strict-transport-security": {"ratio": 1.0},
                "x-content-type-options": {"ratio": 1.0},
            },
        },
        "ai_readiness_data": {
            "pages_analyzed": 4,
            "llms_txt_found": False,
            "robots_txt_found": False,
            "sitemap_xml_found": True,
            "structured_data_pages": 4,
            "semantic_html_pages": 4,
            "meta_description_coverage": 1.0,
        },
        "content_data": {
            "pages_analyzed": 4,
            "avg_word_count": 600,
            "thin_content_pages": 0,
            "duplicate_titles": 0,
            "duplicate_meta_descriptions": 0,
        },
        "mobile_data": {
            "pages_analyzed": 4,
            "viewport_missing_pages": 0,
            "non_responsive_viewport_pages": 0,
        },
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_accessibility_does_not_award_perfect_score_for_zero_images():
    score = score_accessibility({
        "pages_analyzed": 4,
        "images_total": 0,
        "images_missing_alt": 0,
        "form_inputs_total": 4,
        "form_inputs_missing_label": 2,
    })

    assert score == 50.0


def test_accessibility_ignores_zero_denominator_signal():
    score = score_accessibility({
        "pages_analyzed": 4,
        "images_total": 0,
        "images_missing_alt": 0,
        "form_inputs_total": 0,
        "form_inputs_missing_label": 0,
    })

    assert score is None


def test_missing_optional_llms_and_robots_do_not_lower_ai_score():
    base = {
        "pages_analyzed": 4,
        "sitemap_xml_found": True,
        "structured_data_pages": 4,
        "semantic_html_pages": 4,
        "meta_description_coverage": 1.0,
    }

    with_optional_files = score_ai_readiness({
        **base,
        "llms_txt_found": True,
        "robots_txt_found": True,
    })
    without_optional_files = score_ai_readiness({
        **base,
        "llms_txt_found": False,
        "robots_txt_found": False,
    })

    assert with_optional_files == without_optional_files


@pytest.mark.parametrize("ratio", [-0.1, 1.1, float("inf"), float("nan")])
def test_invalid_security_header_ratios_are_ignored(ratio):
    score = score_security({
        "pages_analyzed": 4,
        "https_pages": 4,
        "header_coverage": {
            "bad-header": {"ratio": ratio},
        },
    })

    # HTTPS is fully covered; invalid header data must not lower the score.
    assert score == 100.0


def test_score_explains_coverage_without_claiming_statistical_certainty():
    result = calculate_score(make_analysis())

    assert 0 <= result.overall_score <= 100
    assert 0 <= result.confidence <= 1
    assert "measurement coverage" in result.explanation.lower()
    assert "not a ranking prediction" in result.explanation.lower()


def test_incomplete_analysis_cannot_be_scored():
    with pytest.raises(ValueError, match="completed"):
        calculate_score(make_analysis(status="running"))
