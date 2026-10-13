import json
from dataclasses import dataclass, field

from bs4 import BeautifulSoup

GENERIC_LINK_TEXTS = {"click here", "here", "read more", "more", "link", "this", "learn more"}
SEMANTIC_TAGS = ["article", "nav", "main", "header", "footer", "section", "aside"]


@dataclass
class ImageInfo:
    src: str | None
    alt: str | None


@dataclass
class LinkInfo:
    href: str | None
    text: str


@dataclass
class FormInfo:
    action: str | None
    method: str | None
    input_count: int
    inputs_missing_label: int


@dataclass
class PageData:
    url: str
    title: str | None = None
    meta_description: str | None = None
    meta_keywords: str | None = None
    canonical: str | None = None
    robots_meta: str | None = None
    viewport: str | None = None
    charset: str | None = None
    theme_color: str | None = None
    html_lang: str | None = None
    headings: dict[str, list[str]] = field(default_factory=dict)
    heading_sequence: list[int] = field(default_factory=list)
    heading_order_skips: int = 0
    images: list[ImageInfo] = field(default_factory=list)
    links: list[LinkInfo] = field(default_factory=list)
    generic_link_count: int = 0
    forms: list[FormInfo] = field(default_factory=list)
    iframes_missing_title: int = 0
    json_ld: list[dict] = field(default_factory=list)
    json_ld_errors: int = 0
    semantic_tags: list[str] = field(default_factory=list)
    og_tags: dict[str, str] = field(default_factory=dict)
    twitter_tags: dict[str, str] = field(default_factory=dict)
    touch_icons: list[str] = field(default_factory=list)
    word_count: int = 0
    paragraph_count: int = 0
    text_length: int = 0
    html_length: int = 0
    parse_error: bool = False


def _meta_content(soup: BeautifulSoup, name: str) -> str | None:
    tag = soup.find("meta", attrs={"name": name})
    if tag is None:
        tag = soup.find("meta", attrs={"property": name})
    if tag is None:
        return None
    content = tag.get("content")
    return content.strip() if content and content.strip() else None


def _form_inputs_have_labels(form, soup: BeautifulSoup) -> tuple[int, int]:
    label_fors = {label.get("for") for label in form.find_all("label")}
    inputs = form.find_all(["input", "select", "textarea"])
    total = 0
    missing = 0
    for element in inputs:
        input_type = (element.get("type") or "").lower()
        if element.name == "input" and input_type in {"hidden", "submit", "button", "reset", "image"}:
            continue
        total += 1
        element_id = element.get("id")
        has_label = (
            (element_id and element_id in label_fors)
            or element.find_parent("label") is not None
            or element.get("aria-label")
            or element.get("aria-labelledby")
            or element.get("title")
        )
        if not has_label:
            missing += 1
    return total, missing


def parse_html(url: str, html: str | None) -> PageData:
    data = PageData(url=url)
    try:
        soup = BeautifulSoup(html or "", "html.parser")
    except Exception:
        data.parse_error = True
        return data

    data.html_length = len(html or "")

    title_tag = soup.find("title")
    data.title = title_tag.get_text(strip=True) or None if title_tag else None
    data.meta_description = _meta_content(soup, "description")
    data.meta_keywords = _meta_content(soup, "keywords")
    data.robots_meta = _meta_content(soup, "robots")
    data.viewport = _meta_content(soup, "viewport")
    data.theme_color = _meta_content(soup, "theme-color")

    canonical_tag = soup.find("link", rel=lambda value: value and "canonical" in value.lower())
    data.canonical = canonical_tag.get("href") if canonical_tag else None

    html_tag = soup.find("html")
    data.html_lang = html_tag.get("lang") if html_tag else None

    charset_tag = soup.find("meta", charset=True)
    data.charset = charset_tag.get("charset") if charset_tag else None

    headings: dict[str, list[str]] = {}
    sequence: list[int] = []
    for level in range(1, 7):
        tags = [h.get_text(strip=True) for h in soup.find_all(f"h{level}")]
        headings[f"h{level}"] = tags
        sequence.extend([level] * len(tags))
    data.headings = headings
    data.heading_sequence = sequence
    previous = 0
    for level in sequence:
        if previous and level > previous + 1:
            data.heading_order_skips += 1
        previous = level

    data.images = [
        ImageInfo(src=img.get("src"), alt=img.get("alt"))
        for img in soup.find_all("img")
    ]

    for link in soup.find_all("a"):
        href = link.get("href")
        text = link.get_text(strip=True)
        data.links.append(LinkInfo(href=href, text=text))
        if text.lower() in GENERIC_LINK_TEXTS:
            data.generic_link_count += 1

    for form in soup.find_all("form"):
        total, missing = _form_inputs_have_labels(form, soup)
        data.forms.append(
            FormInfo(
                action=form.get("action"),
                method=(form.get("method") or "").lower() or None,
                input_count=total,
                inputs_missing_label=missing,
            )
        )

    data.iframes_missing_title = sum(1 for iframe in soup.find_all("iframe") if not iframe.get("title"))

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            parsed = json.loads(script.string or script.get_text() or "")
        except (json.JSONDecodeError, TypeError, ValueError):
            data.json_ld_errors += 1
            continue
        if isinstance(parsed, list):
            data.json_ld.extend(item for item in parsed if isinstance(item, dict))
        elif isinstance(parsed, dict):
            data.json_ld.append(parsed)

    data.semantic_tags = [tag for tag in SEMANTIC_TAGS if soup.find(tag) is not None]

    for meta in soup.find_all("meta"):
        key = meta.get("property") or ""
        if key.startswith("og:"):
            data.og_tags[key] = meta.get("content") or ""
        key = meta.get("name") or ""
        if key.startswith("twitter:") or key == "twitter":
            data.twitter_tags[key] = meta.get("content") or ""

    for icon in soup.find_all("link", rel=lambda value: value and "apple-touch-icon" in value.lower()):
        href = icon.get("href")
        if href:
            data.touch_icons.append(href)

    text = soup.get_text(separator=" ")
    data.word_count = len(text.split())
    data.text_length = len(text.strip())
    data.paragraph_count = sum(1 for p in soup.find_all("p") if p.get_text(strip=True))

    return data
