from types import SimpleNamespace

import pytest

from app.recommendation_engine import generate_recommendations


def make_analysis(**overrides):
    data = {
        "status": "completed",
        "seo_data": {
            "pages_analyzed": 4,
            "missing_meta_description_pages": 2,
            "missing_title_pages": 0,
            "multiple_h1_pages": 0,
            "missing_canonical_pages": 0,
            "noindex_pages": 0,
        },
        "accessibility_data": {
            "pages_analyzed": 4,
            "images_total": 20,
            "images_missing_alt": 5,
            "form_inputs_total": 2,
            "form_inputs_missing_label": 1,
            "pages_with_heading_skips": 0,
            "generic_link_texts": 0,
        },
        "performance_data": {
            "pages_analyzed": 4,
            "avg_ttfb_ms": 1200,
            "avg_total_time_ms": 1800,
            "avg_page_size_kb": 400,
        },
        "security_data": {
            "pages_analyzed": 4,
            "https_pages": 4,
            "header_coverage": {
                "strict-transport-security": {"ratio": 0.0},
                "x-content-type-options": {"ratio": 0.0},
                "referrer-policy": {"ratio": 1.0},
                "permissions-policy": {"ratio": 1.0},
                "x-frame-options": {"ratio": 1.0},
            },
            "server_header_disclosed_pages": 0,
        },
        "ai_readiness_data": {
            "pages_analyzed": 4,
            "robots_txt_found": True,
            "sitemap_xml_found": True,
            "llms_txt_found": False,
        },
        "content_data": {
            "pages_analyzed": 4,
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


def test_generates_recommendations_from_observed_issues():
    recommendations = generate_recommendations(make_analysis())
    issues = {item["issue"] for item in recommendations}

    assert "seo_missing_meta_descriptions" in issues
    assert "accessibility_missing_image_alt" in issues
    assert "accessibility_unlabeled_form_inputs" in issues
    assert "performance_high_ttfb" in issues
    assert "security_header_strict_transport_security" in issues


def test_recommendations_have_required_fields_and_stable_priority_order():
    recommendations = generate_recommendations(make_analysis())
    priority_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}

    assert recommendations
    assert all(item["issue"] for item in recommendations)
    assert all(item["description"] for item in recommendations)
    assert all(item["priority"] in priority_rank for item in recommendations)
    assert all(item["suggested_implementation"] for item in recommendations)

    actual = [priority_rank[item["priority"]] for item in recommendations]
    assert actual == sorted(actual)


def test_missing_llms_txt_does_not_create_mandatory_recommendation():
    analysis = make_analysis(
        ai_readiness_data={
            "pages_analyzed": 4,
            "robots_txt_found": True,
            "sitemap_xml_found": True,
            "llms_txt_found": False,
        }
    )

    issues = {item["issue"] for item in generate_recommendations(analysis)}
    assert "ai_publish_llms_txt" not in issues


def test_uncompleted_analysis_is_rejected():
    with pytest.raises(ValueError, match="completed analysis"):
        generate_recommendations(make_analysis(status="running"))


def test_empty_metrics_return_no_recommendations():
    analysis = make_analysis(
        seo_data={},
        accessibility_data={},
        performance_data={},
        security_data={},
        ai_readiness_data={},
        content_data={},
        mobile_data={},
    )

    assert generate_recommendations(analysis) == []
