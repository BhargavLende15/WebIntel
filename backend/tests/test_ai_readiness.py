from conftest import make_crawl_result, make_robots, make_page

from app.analysis import ai_readiness

ROBOTS_TEXT = """User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
"""


class StubResponse:
    def __init__(self, status_code=404, text=""):
        self.status_code = status_code
        self.text = text


class StubClient:
    def __init__(self, responses=None):
        self.responses = responses or {}
        self.requested = []

    def get(self, url):
        self.requested.append(url)
        return self.responses.get(url, StubResponse(404, ""))


def test_ai_readiness_site_analysis():
    crawl = make_crawl_result(
        "https://example.com/",
        [
            make_page("https://example.com/"),
            make_page("https://example.com/bad", "<html><body><p>thin</p></body></html>"),
        ],
    )
    crawl.robots = make_robots(ROBOTS_TEXT)
    client = StubClient()

    result = ai_readiness.analyze_site(crawl, client)

    assert result["llms_txt_found"] is False
    assert result["sitemap_xml_found"] is False
    assert result["robots_txt_found"] is True
    assert result["sitemaps_in_robots"] == ["https://example.com/sitemap.xml"]
    assert result["ai_crawler_access"]["GPTBot"] == "disallowed"
    assert result["ai_crawler_access"]["ClaudeBot"] == "not_mentioned"
    assert result["ai_crawler_access"]["Google-Extended"] == "not_mentioned"
    assert result["structured_data_pages"] == 1
    assert result["meta_description_coverage"] == 0.5
    assert len(client.requested) == 2


def test_ai_readiness_llms_txt_found():
    crawl = make_crawl_result("https://example.com/", [make_page("https://example.com/")])
    client = StubClient(
        {
            "https://example.com/llms.txt": StubResponse(200, "# Example\n\n- [Docs](https://example.com/docs)"),
            "https://example.com/sitemap.xml": StubResponse(200, "<urlset></urlset>"),
        }
    )

    result = ai_readiness.analyze_site(crawl, client)

    assert result["llms_txt_found"] is True
    assert result["llms_txt_bytes"] > 0
    assert result["sitemap_xml_found"] is True
    assert result["ai_crawler_access"]["GPTBot"] == "no_robots_txt"


def test_ai_readiness_allowed_crawler():
    robots_text = "User-agent: ClaudeBot\nAllow: /\n"
    crawl = make_crawl_result("https://example.com/", [make_page("https://example.com/")])
    crawl.robots = make_robots(robots_text)

    result = ai_readiness.analyze_site(crawl, StubClient())

    assert result["ai_crawler_access"]["ClaudeBot"] == "allowed"
