from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from conftest import make_crawl_result, make_page
from app.analysis import ai_readiness as ai_readiness_module
from app.analysis import engine as engine_module
from app.main import app


@pytest.fixture()
def security_setup(monkeypatch):
    from app.utils.config import settings

    monkeypatch.setattr(
        settings, "SECRET_KEY", "test-only-secret-key-not-for-production-123456"
    )
    monkeypatch.setattr(
        engine_module,
        "crawl_site",
        lambda url, **kwargs: make_crawl_result(
            str(url), [make_page(str(url))]
        ),
    )
    monkeypatch.setattr(
        ai_readiness_module, "_fetch_text", lambda client, url: (404, None)
    )

    with TestClient(app) as client:
        def create_user(label):
            email = f"{label}-{uuid4().hex}@example.com"
            password = f"Test-{uuid4().hex}-Secure!"

            registered = client.post(
                "/api/v1/auth/register",
                json={"email": email, "password": password, "full_name": label},
            )
            assert registered.status_code == 201, registered.text

            login = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            assert login.status_code == 200, login.text
            return login.json()["access_token"]

        owner_token = create_user("security-owner")
        other_token = create_user("security-other")

        client.headers.update({"Authorization": f"Bearer {owner_token}"})
        created = client.post(
            "/api/v1/analyze",
            json={"url": f"https://{uuid4().hex}.example.com"},
        )
        assert created.status_code == 202, created.text

        analysis_id = created.json()["analysis_id"]

        yield {
            "client": client,
            "owner_token": owner_token,
            "other_token": other_token,
            "analysis_id": analysis_id,
            "website_id": created.json()["website_id"],
        }


def test_protected_endpoints_reject_unauthenticated_requests():
    with TestClient(app) as client:
        analysis_id = "00000000-0000-0000-0000-000000000000"

        responses = [
            client.get(f"/api/v1/analysis/{analysis_id}"),
            client.get(f"/api/v1/dashboard/{analysis_id}"),
            client.post("/api/v1/score", json={"analysis_id": analysis_id}),
            client.post(
                "/api/v1/recommendations", json={"analysis_id": analysis_id}
            ),
            client.post("/api/v1/report/pdf", json={"analysis_id": analysis_id}),
        ]

        assert [response.status_code for response in responses] == [401] * len(responses)


@pytest.mark.parametrize(
    ("method", "path_suffix", "payload"),
    [
        ("get", "", None),
        ("get", "/dashboard", None),
        ("post", "/score", {"analysis_id": "__ANALYSIS_ID__"}),
        ("post", "/recommendations", {"analysis_id": "__ANALYSIS_ID__"}),
        ("post", "/report/pdf", {"analysis_id": "__ANALYSIS_ID__"}),
    ],
)
def test_other_user_cannot_access_analysis(
    security_setup, method, path_suffix, payload
):
    client = security_setup["client"]
    analysis_id = security_setup["analysis_id"]

    client.headers.update(
        {"Authorization": f"Bearer {security_setup['other_token']}"}
    )

    if path_suffix in ("", "/dashboard"):
        path = f"/api/v1/analysis/{analysis_id}" if not path_suffix else (
            f"/api/v1/dashboard/{analysis_id}"
        )
        response = client.get(path)
    else:
        request_payload = {"analysis_id": analysis_id}
        response = client.post(f"/api/v1{path_suffix}", json=request_payload)

    assert response.status_code == 404, response.text


def test_owner_can_download_pdf_report(security_setup):
    client = security_setup["client"]
    analysis_id = security_setup["analysis_id"]

    client.headers.update(
        {"Authorization": f"Bearer {security_setup['owner_token']}"}
    )

    analysis = client.get(f"/api/v1/analysis/{analysis_id}")
    assert analysis.status_code == 200, analysis.text
    assert analysis.json()["status"] == "completed"

    score_response = client.post(
        "/api/v1/score", json={"analysis_id": analysis_id}
    )
    assert score_response.status_code == 200, score_response.text

    pdf_response = client.post(
        "/api/v1/report/pdf",
        json={
            "analysis_id": analysis_id,
            "format": "pdf",
            "include_charts": True,
            "include_recommendations": True,
        },
    )

    assert pdf_response.status_code == 200, pdf_response.text
    assert "application/pdf" in pdf_response.headers.get("content-type", "")
    assert pdf_response.content.startswith(b"%PDF")



def test_new_endpoints_reject_unauthenticated_requests():
    with TestClient(app) as client:
        website_id = "00000000-0000-0000-0000-000000000000"
        responses = [
            client.get(f"/api/v1/history/{website_id}"),
            client.post("/api/v1/chat", json={"message": "test", "website_id": website_id}),
            client.post("/api/v1/predict", json={"website_id": website_id}),
            client.post("/api/v1/monitor", json={"website_id": website_id}),
        ]
        assert [response.status_code for response in responses] == [401] * 4


def test_other_user_cannot_access_website_endpoints(security_setup):
    client = security_setup["client"]
    website_id = security_setup["website_id"]
    client.headers.update(
        {"Authorization": f"Bearer {security_setup['other_token']}"}
    )

    responses = [
        client.get(f"/api/v1/history/{website_id}"),
        client.post("/api/v1/chat", json={"message": "test", "website_id": website_id}),
        client.post("/api/v1/predict", json={"website_id": website_id}),
        client.post("/api/v1/monitor", json={"website_id": website_id}),
    ]
    assert [response.status_code for response in responses] == [404] * 4


def test_owner_can_use_website_endpoints(security_setup):
    client = security_setup["client"]
    website_id = security_setup["website_id"]
    client.headers.update(
        {"Authorization": f"Bearer {security_setup['owner_token']}"}
    )

    history = client.get(f"/api/v1/history/{website_id}")
    prediction = client.post("/api/v1/predict", json={"website_id": website_id})
    monitoring = client.post("/api/v1/monitor", json={"website_id": website_id})
    chat = client.post(
        "/api/v1/chat",
        json={"message": "Summarize this website", "website_id": website_id},
    )

    assert history.status_code == 200, history.text
    assert prediction.status_code == 200, prediction.text
    assert monitoring.status_code == 200, monitoring.text
    assert chat.status_code == 200, chat.text

    session_id = chat.json()["session_id"]
    reused = client.post(
        "/api/v1/chat",
        json={"message": "Follow-up", "session_id": session_id},
    )
    assert reused.status_code == 200, reused.text


def test_other_user_cannot_reuse_chat_session(security_setup):
    client = security_setup["client"]
    website_id = security_setup["website_id"]
    client.headers.update(
        {"Authorization": f"Bearer {security_setup['owner_token']}"}
    )
    created = client.post(
        "/api/v1/chat",
        json={"message": "Start", "website_id": website_id},
    )
    assert created.status_code == 200, created.text

    client.headers.update(
        {"Authorization": f"Bearer {security_setup['other_token']}"}
    )
    response = client.post(
        "/api/v1/chat",
        json={"message": "Steal session", "session_id": created.json()["session_id"]},
    )
    assert response.status_code == 404, response.text




