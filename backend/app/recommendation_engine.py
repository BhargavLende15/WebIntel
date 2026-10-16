"""Deterministic recommendations derived from observed website analysis metrics."""

from __future__ import annotations

from math import isfinite

from typing import Any


def _number(data: dict[str, Any] | None, key: str) -> float | None:
    if not isinstance(data, dict):
        return None
    value = data.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    value = float(value)
    if value < 0 or value != value or value == float("inf"):
        return None
    return value


def _add(
    results: list[dict[str, Any]],
    *,
    issue: str,
    description: str,
    why: str,
    impact: str,
    priority: str,
    improvement: float,
    difficulty: str,
    implementation: str,
) -> None:
    results.append({
        "issue": issue,
        "description": description,
        "why_it_matters": why,
        "business_impact": impact,
        "priority": priority,
        "estimated_improvement": improvement,
        "difficulty": difficulty,
        "suggested_implementation": implementation,
    })


def generate_recommendations(analysis: Any) -> list[dict[str, Any]]:
    """Generate stable, evidence-based recommendations from a completed analysis."""
    if getattr(analysis, "status", None) != "completed":
        raise ValueError("Recommendations require a completed analysis.")

    results: list[dict[str, Any]] = []
    seo = getattr(analysis, "seo_data", None) or {}
    accessibility = getattr(analysis, "accessibility_data", None) or {}
    performance = getattr(analysis, "performance_data", None) or {}
    security = getattr(analysis, "security_data", None) or {}
    ai = getattr(analysis, "ai_readiness_data", None) or {}
    content = getattr(analysis, "content_data", None) or {}
    mobile = getattr(analysis, "mobile_data", None) or {}

    # SEO
    pages = _number(seo, "pages_analyzed")
    missing = _number(seo, "missing_meta_description_pages")
    if pages and missing is not None and missing > 0:
        _add(
            results, issue="seo_missing_meta_descriptions",
            description=f"{int(missing)} of {int(pages)} analyzed pages lack meta descriptions.",
            why="Search engines may generate their own snippets, which can be less relevant to the page.",
            impact="Improve search-result messaging and potentially increase qualified organic clicks.",
            priority="high" if missing / pages >= 0.25 else "medium",
            improvement=3.0, difficulty="low",
            implementation="Write a unique, accurate description for each affected page. Check the page source after deployment.",
        )

    missing = _number(seo, "missing_title_pages")
    if pages and missing is not None and missing > 0:
        _add(
            results, issue="seo_missing_titles",
            description=f"{int(missing)} of {int(pages)} analyzed pages lack a detected title.",
            why="Titles help users and search engines understand each page.",
            impact="Improve page identification in browser tabs, search results, and shared links.",
            priority="high", improvement=5.0, difficulty="low",
            implementation="Add a distinct, descriptive HTML title to each affected page and verify it in the rendered/source HTML.",
        )

    missing = _number(seo, "multiple_h1_pages")
    if missing is not None and missing > 0:
        _add(
            results, issue="seo_multiple_h1",
            description=f"{int(missing)} pages have multiple detected H1 headings.",
            why="A clear primary heading can make the page's main topic easier to identify.",
            impact="Improve content hierarchy and consistency; multiple H1 elements are not automatically a search penalty.",
            priority="low", improvement=1.0, difficulty="low",
            implementation="Review each affected page and ensure its heading structure clearly communicates the main topic.",
        )

    missing = _number(seo, "missing_canonical_pages")
    if pages and missing is not None and missing > 0:
        _add(
            results, issue="seo_missing_canonicals",
            description=f"{int(missing)} pages lack a detected canonical URL.",
            why="Canonical tags can clarify the preferred URL when duplicate or similar content exists.",
            impact="Reduce ambiguity for crawlers on pages where URL variants or duplicate content are possible.",
            priority="medium", improvement=2.0, difficulty="low",
            implementation="Review URL variants and add a self-referencing canonical or the correct preferred URL where appropriate.",
        )

    missing = _number(seo, "noindex_pages")
    if missing is not None and missing > 0:
        _add(
            results, issue="seo_noindex_pages",
            description=f"{int(missing)} pages are marked noindex.",
            why="A noindex directive asks compliant search engines not to include a page in search results.",
            impact="Important pages may become undiscoverable through organic search if the directive is unintended.",
            priority="high", improvement=4.0, difficulty="low",
            implementation="Confirm that each affected page is intentionally excluded. Remove noindex only from pages that should be indexed.",
        )

    # Accessibility
    images = _number(accessibility, "images_total")
    missing_alt = _number(accessibility, "images_missing_alt")
    if images and missing_alt is not None and missing_alt > 0:
        _add(
            results, issue="accessibility_missing_image_alt",
            description=f"{int(missing_alt)} of {int(images)} analyzed images lack detected alternative text.",
            why="Meaningful alt text helps people using screen readers understand informative images.",
            impact="Improve access to image information and the usability of the site for more visitors.",
            priority="high" if missing_alt / images >= 0.2 else "medium",
            improvement=4.0, difficulty="low",
            implementation="Add concise, contextual alt text to informative images. Use empty alt text for purely decorative images.",
        )

    inputs = _number(accessibility, "form_inputs_total")
    unlabeled = _number(accessibility, "form_inputs_missing_label")
    if inputs and unlabeled is not None and unlabeled > 0:
        _add(
            results, issue="accessibility_unlabeled_form_inputs",
            description=f"{int(unlabeled)} of {int(inputs)} analyzed form inputs lack a detected label.",
            why="Programmatic labels help assistive-technology users identify what each field expects.",
            impact="Reduce form confusion and improve completion for visitors using assistive technologies.",
            priority="high", improvement=4.0, difficulty="medium",
            implementation="Associate each input with a visible label using matching for/id attributes, or provide an appropriate accessible name.",
        )

    skipped = _number(accessibility, "pages_with_heading_skips")
    if skipped is not None and skipped > 0:
        _add(
            results, issue="accessibility_heading_order",
            description=f"{int(skipped)} pages contain detected heading-level skips.",
            why="Logical heading hierarchy helps users navigate and understand page structure.",
            impact="Improve navigation and comprehension, particularly for screen-reader users.",
            priority="medium", improvement=2.0, difficulty="low",
            implementation="Review heading levels in each affected page. Use headings according to content hierarchy rather than visual size.",
        )

    generic = _number(accessibility, "generic_link_texts")
    if generic is not None and generic > 0:
        _add(
            results, issue="accessibility_generic_link_text",
            description=f"{int(generic)} generic link texts were detected across the analyzed pages.",
            why="Labels such as 'click here' provide little context when links are read out of context.",
            impact="Make navigation destinations clearer for users and assistive technologies.",
            priority="low", improvement=1.0, difficulty="low",
            implementation="Replace generic link labels with concise text describing the destination or action.",
        )

    # Performance: HTTP-level measurements, not browser-rendered Core Web Vitals.
    ttfb = _number(performance, "avg_ttfb_ms")
    if ttfb is not None and ttfb > 800:
        _add(
            results, issue="performance_high_ttfb",
            description=f"Average time to first byte is {ttfb:.0f} ms.",
            why="Slow server responses delay the start of page loading.",
            impact="Investigate potential improvements to perceived responsiveness and user experience.",
            priority="high" if ttfb > 1800 else "medium",
            improvement=5.0, difficulty="high",
            implementation="Profile server and database response times, caching, redirects, and hosting/network latency. Re-measure after changes.",
        )

    response = _number(performance, "avg_total_time_ms")
    if response is not None and response > 2500:
        _add(
            results, issue="performance_slow_http_response",
            description=f"Average measured HTTP response time is {response:.0f} ms.",
            why="Long response times can delay page retrieval.",
            impact="Identify slow pages and improve the loading experience where possible.",
            priority="high" if response > 4000 else "medium",
            improvement=4.0, difficulty="medium",
            implementation="Inspect the slowest URLs, backend processing, caching, and network requests. This is HTTP timing, not a browser-rendered speed score.",
        )

    size = _number(performance, "avg_page_size_kb")
    if size is not None and size > 1000:
        _add(
            results, issue="performance_large_page_payload",
            description=f"Average transferred page size is {size:.0f} KB.",
            why="Large responses can increase transfer time, especially on constrained connections.",
            impact="Potentially reduce data usage and improve loading on slower networks.",
            priority="medium", improvement=3.0, difficulty="medium",
            implementation="Inspect large HTML responses and embedded content; remove unnecessary markup and defer nonessential content where appropriate.",
        )

    # Security headers
    headers = security.get("header_coverage") if isinstance(security, dict) else None
    if isinstance(headers, dict):
        recommended_headers = {
            "strict-transport-security": ("Enable HSTS where HTTPS is fully supported.", "high"),
            "x-content-type-options": ("Set X-Content-Type-Options: nosniff.", "medium"),
            "referrer-policy": ("Set a deliberate Referrer-Policy.", "low"),
            "permissions-policy": ("Define a restrictive Permissions-Policy appropriate to site features.", "low"),
            "x-frame-options": ("Set an appropriate framing policy; CSP frame-ancestors is the modern alternative.", "medium"),
        }
        for header, (action, priority) in recommended_headers.items():
            entry = headers.get(header)
            ratio = entry.get("ratio") if isinstance(entry, dict) else None
            if (
                isinstance(ratio, (int, float))
                and not isinstance(ratio, bool)
                and isfinite(ratio)
                and 0.0 <= ratio < 1.0
            ):
                _add(
                    results, issue=f"security_header_{header.replace('-', '_')}",
                    description=f"The {header} header was not detected on every analyzed page.",
                    why="Security headers can reduce specific browser-side risks when configured appropriately.",
                    impact="Improve defense-in-depth; header presence alone does not guarantee security.",
                    priority=priority, improvement=2.0, difficulty="medium",
                    implementation=action,
                )

    disclosed = _number(security, "server_header_disclosed_pages")
    if disclosed is not None and disclosed > 0:
        _add(
            results, issue="security_server_header_disclosure",
            description=f"A server-identifying response header was detected on {int(disclosed)} pages.",
            why="Detailed server banners can reveal implementation information that is usually unnecessary to disclose.",
            impact="Reduce avoidable information disclosure; this is a hardening measure, not proof of a vulnerability.",
            priority="low", improvement=1.0, difficulty="low",
            implementation="Where operationally supported, remove or minimize server-identifying response headers and verify that monitoring still works.",
        )

    # AI/crawler discoverability. llms.txt is optional, not a required standard.
    if ai.get("robots_txt_found") is False:
        _add(
            results, issue="ai_publish_robots_txt",
            description="The crawl did not find a robots.txt file.",
            why="A robots.txt file can document crawl preferences for compliant crawlers; its absence does not itself block crawling.",
            impact="Make crawler policy explicit and easier to maintain.",
            priority="medium", improvement=2.0, difficulty="low",
            implementation="Publish /robots.txt with deliberate rules for the site's public and restricted paths. Verify that intended search and AI crawlers are treated according to your policy.",
        )

    if ai.get("sitemap_xml_found") is False:
        _add(
            results, issue="ai_publish_sitemap",
            description="The crawl did not find an XML sitemap.",
            why="A sitemap can help discovery of canonical, indexable URLs.",
            impact="Support discovery of important public pages by compliant crawlers.",
            priority="medium", improvement=3.0, difficulty="low",
            implementation="Generate and publish an XML sitemap containing canonical, indexable URLs, then reference it in robots.txt and submit it to relevant webmaster tools.",
        )

    # Content quality
    thin = _number(content, "thin_content_pages")
    content_pages = _number(content, "pages_analyzed")
    if thin is not None and thin > 0:
        _add(
            results, issue="content_thin_pages",
            description=f"{int(thin)} pages were classified as thin content by the current heuristic.",
            why="Pages with limited useful information may not satisfy visitors' intent.",
            impact="Improve usefulness and clarity on pages that genuinely lack substantive content.",
            priority="medium", improvement=3.0, difficulty="medium",
            implementation="Review the flagged pages manually and add original, relevant information where it benefits the reader. Do not expand content just to reach a word-count target.",
        )

    for key, issue, label in (
        ("duplicate_titles", "content_duplicate_titles", "title"),
        ("duplicate_meta_descriptions", "content_duplicate_meta_descriptions", "meta description"),
    ):
        count = _number(content, key)
        if count is not None and count > 0:
            _add(
                results, issue=issue,
                description=f"{int(count)} duplicate {label}(s) were detected by the analyzer.",
                why="Repeated metadata may make similar pages harder to distinguish in search results.",
                impact="Improve page-specific messaging and reduce ambiguity for visitors.",
                priority="medium", improvement=2.0, difficulty="low",
                implementation=f"Review duplicate {label}s and write distinct, accurate metadata for pages with different purposes.",
            )

    # Mobile signals are HTML-level checks, not viewport rendering tests.
    mobile_pages = _number(mobile, "pages_analyzed")
    for key, issue, description in (
        ("viewport_missing_pages", "mobile_missing_viewport", "missing a responsive viewport declaration"),
        ("non_responsive_viewport_pages", "mobile_nonresponsive_viewport", "using a viewport declaration flagged as non-responsive"),
    ):
        count = _number(mobile, key)
        if count is not None and count > 0:
            _add(
                results, issue=issue,
                description=f"{int(count)} pages were detected {description}.",
                why="Viewport configuration affects how pages are laid out on mobile devices.",
                impact="Reduce the risk of poor mobile rendering; actual layouts require browser/device testing.",
                priority="high" if mobile_pages and count / mobile_pages >= 0.25 else "medium",
                improvement=4.0, difficulty="low",
                implementation="Add or correct the responsive viewport meta tag, then verify layouts at common mobile widths in a real browser.",
            )

    # Stable ordering makes API responses and repeat runs predictable.
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    results.sort(key=lambda item: (priority_order.get(item["priority"], 4), item["issue"]))
    return results
