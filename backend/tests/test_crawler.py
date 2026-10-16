import pytest
from conftest import MINIMAL_HTML, SAMPLE_HTML, make_fetch, make_robots
from app.services.fetcher import FetchResult

from app.services import crawler
from app.services.fetcher import validate_fetch_url


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/",
        "http://10.0.0.1/",
        "http://192.168.1.1/",
        "http://169.254.169.254/",
        "http://localhost/",
        "http://service.localhost/",
        "file:///etc/passwd",
        "https://user:password@example.com/",
    ],
)
def test_validate_fetch_url_rejects_unsafe_targets(url):
    assert validate_fetch_url(url) is not None


def test_validate_fetch_url_accepts_public_http_url():
    assert validate_fetch_url("https://example.com/path") is None


@pytest.fixture
def fake_fetch(monkeypatch):
    from app.services.fetcher import FetchResult as FetchResultClass

    def _install(site):
        def _fetch(client, url):
            if url in site:
                value = site[url]
                if isinstance(value, FetchResultClass):
                    return value
                return make_fetch(url, html=value)
            return FetchResultClass(url=url, error="not found")

        monkeypatch.setattr(crawler, "fetch_page", _fetch)

    return _install


def test_normalize_url_strips_fragment_and_default_ports():
    assert crawler.normalize_url("https://Example.COM:443/path#section") == "https://example.com/path"
    assert crawler.normalize_url("http://example.com:80/a?b=2") == "http://example.com/a?b=2"
    assert crawler.normalize_url("https://example.com") == "https://example.com/"


def test_normalize_url_rejects_non_pages():
    assert crawler.normalize_url("mailto:user@example.com") is None
    assert crawler.normalize_url("javascript:void(0)") is None
    assert crawler.normalize_url("tel:+123456") is None
    assert crawler.normalize_url("no-scheme-path") is None


def test_normalize_url_resolves_relative():
    assert (
        crawler.normalize_url("/about", base="https://example.com/blog/post")
        == "https://example.com/about"
    )
    assert (
        crawler.normalize_url("../team", base="https://example.com/blog/post")
        == "https://example.com/team"
    )


def test_is_page_url_filters_assets():
    assert crawler.is_page_url("https://example.com/about") is True
    assert crawler.is_page_url("https://example.com/docs/page.html") is True
    assert crawler.is_page_url("https://example.com/logo.PNG") is False
    assert crawler.is_page_url("https://example.com/files/report.pdf") is False
    assert crawler.is_page_url("https://example.com/data.xml") is False


def test_crawl_discovers_same_domain_pages(fake_fetch):
    fake_fetch(
        {
            "https://example.com/": '<html><body><a href="/a">A</a><a href="/b">B</a>'
            '<a href="https://other.com/x">Ext</a><a href="/logo.jpg">Logo</a></body></html>',
            "https://example.com/a": '<html><body><a href="/b">B again</a></body></html>',
            "https://example.com/b": "<html><body>leaf</body></html>",
        }
    )

    result = crawler.crawl_site(
        "https://example.com/",
        robots=crawler.RobotsInfo(),
    )

    crawled_urls = sorted(page.url for page in result.pages)
    assert crawled_urls == ["https://example.com/", "https://example.com/a", "https://example.com/b"]
    assert result.discovered_count == 3
    assert len(result.successful_pages) == 3
    assert result.max_pages_reached is False


def test_crawl_respects_max_pages(fake_fetch):
    fake_fetch(
        {
            "https://example.com/": '<a href="/1">1</a><a href="/2">2</a><a href="/3">3</a>',
            "https://example.com/1": "one",
            "https://example.com/2": "two",
            "https://example.com/3": "three",
        }
    )

    result = crawler.crawl_site("https://example.com/", max_pages=2, robots=crawler.RobotsInfo())

    assert len(result.pages) == 2
    assert result.max_pages_reached is True


def test_crawl_respects_robots_disallow(fake_fetch):
    fake_fetch(
        {
            "https://example.com/": '<a href="/private">Secret</a><a href="/ok">OK</a>',
            "https://example.com/private": "secret",
            "https://example.com/ok": "fine",
        }
    )
    robots = make_robots("User-agent: *\nDisallow: /private\n")

    result = crawler.crawl_site("https://example.com/", robots=robots)

    crawled_urls = [page.url for page in result.pages]
    assert "https://example.com/private" not in crawled_urls
    assert "https://example.com/ok" in crawled_urls
    assert result.skipped_by_robots == 1


def test_crawl_records_fetch_errors(fake_fetch):
    fake_fetch({"https://example.com/": SAMPLE_HTML})

    result = crawler.crawl_site(
        "https://example.com/",
        max_pages=1,
        robots=crawler.RobotsInfo(),
    )

    assert len(result.successful_pages) == 1
    assert result.errors == []


def test_crawl_handles_malformed_html(fake_fetch):
    fake_fetch({"https://example.com/": "<html><head><title>Broken"})

    result = crawler.crawl_site("https://example.com/", max_pages=1, robots=crawler.RobotsInfo())

    assert result.successful_pages[0].parsed.title == "Broken"


def test_crawl_rejects_invalid_start_url():
    with pytest.raises(ValueError):
        crawler.crawl_site("mailto:not-a-site", robots=crawler.RobotsInfo())


def test_crawl_minimal_html_page_parses(fake_fetch):
    fake_fetch({"https://example.com/": MINIMAL_HTML})

    result = crawler.crawl_site("https://example.com/", max_pages=1, robots=crawler.RobotsInfo())

    assert result.successful_pages[0].parsed.word_count < 10


def test_robots_txt_found_when_valid(fake_fetch):
    robots_html = "User-agent: *\nAllow: /\n"
    fake_fetch(
        {
            "https://example.com/": SAMPLE_HTML,
            "https://example.com/robots.txt": robots_html,
        }
    )

    result = crawler.crawl_site("https://example.com/")

    assert result.robots.fetched is True
    assert result.robots.text == robots_html


def test_robots_txt_not_found_when_404(fake_fetch):
    fake_fetch(
        {
            "https://example.com/": SAMPLE_HTML,
            "https://example.com/robots.txt": FetchResult(url="https://example.com/robots.txt", status_code=404, error="Not Found"),
        }
    )

    result = crawler.crawl_site("https://example.com/")

    assert result.robots.fetched is False


def test_robots_txt_redirect_followed(fake_fetch):
    robots_html = "User-agent: *\nDisallow: /private\n"
    fake_fetch(
        {
            "http://example.com/": SAMPLE_HTML,
            "http://example.com/robots.txt": FetchResult(
                url="http://example.com/robots.txt",
                final_url="https://example.com/robots.txt",
                status_code=200,
                html=robots_html,
                content_type="text/plain",
                ttfb_ms=10.0,
                total_time_ms=20.0,
                size_bytes=len(robots_html),
            ),
            "https://example.com/robots.txt": robots_html,
        }
    )

    result = crawler.crawl_site("http://example.com/")

    assert result.robots.fetched is True
    assert result.robots.text == robots_html

def test_fetch_page_validates_redirect_targets(monkeypatch):
    import socket
    import httpx
    from app.services import fetcher

    monkeypatch.setattr(
        fetcher,
        "_validate_public_dns",
        lambda host: None if host == "example.com" else "Hostname resolves to a non-public IP address.",
    )

    class FakeResponse:
        def __init__(self, url, status_code, headers=None, body=b""):
            self.url = httpx.URL(url)
            self.status_code = status_code
            self.headers = headers or {}
            self.encoding = "utf-8"
            self.closed = False
            self.body = body

        def iter_bytes(self):
            yield self.body

        def close(self):
            self.closed = True

    class FakeClient:
        def __init__(self, responses):
            self.responses = iter(responses)
            self.requested = []

        def build_request(self, method, url):
            return httpx.Request(method, url)

        def send(self, request, stream=True, follow_redirects=False):
            self.requested.append(str(request.url))
            return next(self.responses)

    client = FakeClient([
        FakeResponse("https://example.com/", 302, {"location": "https://127.0.0.1/private"}),
    ])
    result = fetcher.fetch_page(client, "https://example.com/")

    assert result.error == "Non-public IP addresses are not allowed."
    assert client.requested == ["https://example.com/"]


def test_fetch_page_follows_validated_redirect(monkeypatch):
    import httpx
    from app.services import fetcher

    monkeypatch.setattr(fetcher, "_validate_public_dns", lambda host: None)

    class FakeResponse:
        def __init__(self, url, status_code, headers=None, body=b""):
            self.url = httpx.URL(url)
            self.status_code = status_code
            self.headers = headers or {}
            self.encoding = "utf-8"
            self.body = body
            self.closed = False

        def iter_bytes(self):
            yield self.body

        def close(self):
            self.closed = True

    class FakeClient:
        def __init__(self):
            self.requested = []
            self.responses = [
                FakeResponse("https://example.com/", 302, {"location": "/final"}),
                FakeResponse(
                    "https://example.com/final",
                    200,
                    {"content-type": "text/html; charset=utf-8"},
                    b"<html>ok</html>",
                ),
            ]

        def build_request(self, method, url):
            return httpx.Request(method, url)

        def send(self, request, stream=True, follow_redirects=False):
            self.requested.append(str(request.url))
            return self.responses.pop(0)

    client = FakeClient()
    result = fetcher.fetch_page(client, "https://example.com/")

    assert result.ok
    assert result.final_url == "https://example.com/final"
    assert result.html == "<html>ok</html>"
    assert client.requested == [
        "https://example.com/",
        "https://example.com/final",
    ]


def test_fetch_page_rejects_redirect_without_location(monkeypatch):
    import httpx
    from app.services import fetcher

    monkeypatch.setattr(fetcher, "_validate_public_dns", lambda host: None)

    class FakeResponse:
        url = httpx.URL("https://example.com/")
        status_code = 302
        headers = {}
        closed = False

        def close(self):
            self.closed = True

    class FakeClient:
        def build_request(self, method, url):
            return httpx.Request(method, url)

        def send(self, request, stream=True, follow_redirects=False):
            return FakeResponse()

    result = fetcher.fetch_page(FakeClient(), "https://example.com/")
    assert result.error == "Redirect response has no Location header."
