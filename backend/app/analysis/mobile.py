from app.analysis.parser import PageData


def viewport_is_valid(viewport: str | None) -> bool:
    if not viewport:
        return False
    normalized = viewport.lower().replace(" ", "")
    return "width=device-width" in normalized


def analyze_page(page: PageData) -> dict:
    return {
        "url": page.url,
        "viewport_present": bool(page.viewport),
        "viewport_content": page.viewport,
        "viewport_responsive": viewport_is_valid(page.viewport),
        "theme_color_present": bool(page.theme_color),
        "apple_touch_icon_present": bool(page.touch_icons),
        "charset_present": bool(page.charset),
    }


def aggregate(results: list[dict]) -> dict:
    pages = len(results)
    if pages == 0:
        return {"pages_analyzed": 0}
    return {
        "pages_analyzed": pages,
        "viewport_missing_pages": sum(1 for r in results if not r["viewport_present"]),
        "non_responsive_viewport_pages": sum(1 for r in results if r["viewport_present"] and not r["viewport_responsive"]),
        "apple_touch_icon_pages": sum(1 for r in results if r["apple_touch_icon_present"]),
        "theme_color_pages": sum(1 for r in results if r["theme_color_present"]),
        "note": "Signals are HTML-level; rendered layout checks require a later phase",
        "pages": results,
    }
