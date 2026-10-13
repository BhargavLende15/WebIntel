from conftest import make_page

from app.analysis import security

SECURE_HEADERS = {
    "strict-transport-security": "max-age=31536000",
    "content-security-policy": "default-src 'self'",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "geolocation=()",
}


def test_security_headers_detected():
    page = make_page("https://example.com/", headers=SECURE_HEADERS)
    result = security.analyze_page(page)

    assert result["is_https"] is True
    assert all(result["headers_present"].values())
    assert result["server_header_disclosed"] is False
    assert result["cookies_secure"] is None


def test_security_http_and_server_disclosure():
    page = make_page(
        "http://example.com/",
        headers={"server": "nginx/1.24.0"},
    )
    result = security.analyze_page(page)

    assert result["is_https"] is False
    assert result["server_header_disclosed"] is True
    assert not any(result["headers_present"].values())


def test_cookie_secure_flag():
    secure = security.analyze_page(make_page("https://example.com/", headers={"set-cookie": "sid=1; Secure; HttpOnly"}))
    insecure = security.analyze_page(make_page("https://example.com/", headers={"set-cookie": "sid=1; HttpOnly"}))

    assert secure["cookies_secure"] is True
    assert insecure["cookies_secure"] is False


def test_security_aggregate():
    results = [
        security.analyze_page(make_page("https://example.com/", headers=SECURE_HEADERS)),
        security.analyze_page(make_page("http://example.com/old")),
    ]
    summary = security.aggregate(results)

    assert summary["pages_analyzed"] == 2
    assert summary["https_pages"] == 1
    assert summary["http_only_pages"] == 1
    assert summary["homepage_https"] is True
    assert summary["header_coverage"]["strict-transport-security"]["ratio"] == 0.5
