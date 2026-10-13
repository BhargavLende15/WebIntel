import pytest
from fastapi.testclient import TestClient

from conftest import MINIMAL_HTML, make_crawl_result, make_page

from app.analysis import ai_readiness as ai_readiness_module
from app.analysis import engine as engine_module
from app.main import app

CATEGORY_FIELDS = [
    "seo_data",
    "content_data",
    "accessibility_data",
    "security_data",
    "performance_data",
    "mobile_data",
    "ai_readiness_data",
]


@pytest.fixture()
def api_client():
    with TestClient(app) as test_client:
        yield test_client


def test_analyze_completes_with_all_categories(api_client, monkeypatch):
    crawl = make_crawl_result(
        "https://example.com/",
        [
            make_page("https://example.com/"),
            make_page("https://example.com/about", MINIMAL_HTML),
        ],
    )
    monkeypatch.setattr(engine_module, "crawl_site", lambda url, **kwargs: crawl)
    monkeypatch.setattr(ai_readiness_module, "_fetch_text", lambda client, url: (404, None))

    response = api_client.post("/api/v1/analyze", json={"url": "https://example.com"})

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "queued"
    assert body["analysis_id"]
    assert body["website_id"]

    result = api_client.get(f"/api/v1/analysis/{body['analysis_id']}")
    assert result.status_code == 200
    data = result.json()

    assert data["status"] == "completed"
    assert data["completed_at"] is not None
    for field in CATEGORY_FIELDS:
        assert data[field] is not None, f"{field} should be populated"
    assert data["seo_data"]["pages_analyzed"] == 2
    assert data["raw_metrics"]["crawl"]["pages_succeeded"] == 2


def test_analyze_failure_marks_failed_with_error_message(api_client, monkeypatch):
    def broken_crawler(url, **kwargs):
        raise RuntimeError("connection refused to https://down.example.com")

    monkeypatch.setattr(engine_module, "crawl_site", broken_crawler)

    response = api_client.post("/api/v1/analyze", json={"url": "https://down.example.com"})

    assert response.status_code == 202
    analysis_id = response.json()["analysis_id"]

    result = api_client.get(f"/api/v1/analysis/{analysis_id}")
    data = result.json()

    assert data["status"] == "failed"
    assert "connection refused" in data["error_message"]
    assert data["completed_at"] is not None
    assert all(data[field] is None for field in CATEGORY_FIELDS)


def test_get_analysis_404(api_client):
    response = api_client.get("/api/v1/analysis/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
