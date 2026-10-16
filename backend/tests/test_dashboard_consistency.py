from conftest import MINIMAL_HTML, make_crawl_result, make_page
from app.analysis import ai_readiness as ai_readiness_module
from app.analysis import engine as engine_module


def test_dashboard_latest_matches_persisted_score(api_client, monkeypatch):
    crawl = make_crawl_result(
        "https://example.com/",
        [make_page("https://example.com/", MINIMAL_HTML)],
    )
    monkeypatch.setattr(engine_module, "crawl_site", lambda url, **kwargs: crawl)
    monkeypatch.setattr(
        ai_readiness_module, "_fetch_text", lambda client, url: (404, None)
    )

    created = api_client.post(
        "/api/v1/analyze", json={"url": "https://example.com"}
    )
    assert created.status_code == 202, created.text
    analysis_id = created.json()["analysis_id"]
    website_id = created.json()["website_id"]

    result = api_client.get(f"/api/v1/analysis/{analysis_id}")
    assert result.status_code == 200, result.text
    assert result.json()["status"] == "completed"

    score_response = api_client.post(
        "/api/v1/score", json={"analysis_id": analysis_id}
    )
    assert score_response.status_code == 200, score_response.text
    score = score_response.json()

    dashboard_response = api_client.get("/api/v1/dashboard/latest")
    assert dashboard_response.status_code == 200, dashboard_response.text
    dashboard = dashboard_response.json()

    assert dashboard["analysis_id"] == analysis_id
    assert dashboard["website_id"] == website_id
    assert dashboard["overall_score"] == score["overall_score"]
    assert dashboard["grade"] == score["grade"]
    assert dashboard["category_scores"] == score["category_scores"]


def test_dashboard_latest_returns_404_without_saved_analysis(api_client):
    response = api_client.get("/api/v1/dashboard/latest")
    assert response.status_code == 404

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.utils.config import settings


@pytest.fixture()
def api_client(monkeypatch):
    monkeypatch.setattr(
        settings,
        "SECRET_KEY",
        "test-only-secret-key-not-for-production-123456",
    )

    with TestClient(app) as client:
        email = f"dashboard-test-{uuid4().hex}@example.com"
        password = f"Test-{uuid4().hex}-Secure!"

        registered = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password},
        )
        assert registered.status_code == 201, registered.text

        login = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login.status_code == 200, login.text

        client.headers.update({
            "Authorization": f"Bearer {login.json()['access_token']}"
        })
        yield client


