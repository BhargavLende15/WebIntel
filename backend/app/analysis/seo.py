from app.analysis.parser import PageData


def analyze_page(page: PageData) -> dict:
    title = page.title or ""
    description = page.meta_description or ""
    h1s = page.headings.get("h1", [])
    images_total = len(page.images)
    images_missing_alt = sum(1 for image in page.images if image.alt is None)
    return {
        "url": page.url,
        "title_present": bool(title),
        "title": title,
        "title_length": len(title),
        "meta_description_present": bool(description),
        "meta_description_length": len(description),
        "h1_count": len(h1s),
        "h1": h1s[:3],
        "headings_total": sum(len(v) for v in page.headings.values()),
        "canonical_present": bool(page.canonical),
        "canonical": page.canonical,
        "robots_noindex": "noindex" in (page.robots_meta or "").lower(),
        "open_graph_tags": len(page.og_tags),
        "images_total": images_total,
        "images_missing_alt": images_missing_alt,
    }


def aggregate(results: list[dict]) -> dict:
    pages = len(results)
    if pages == 0:
        return {"pages_analyzed": 0}
    title_lengths = [r["title_length"] for r in results if r["title_present"]]
    description_lengths = [r["meta_description_length"] for r in results if r["meta_description_present"]]
    return {
        "pages_analyzed": pages,
        "missing_title_pages": sum(1 for r in results if not r["title_present"]),
        "missing_meta_description_pages": sum(1 for r in results if not r["meta_description_present"]),
        "multiple_h1_pages": sum(1 for r in results if r["h1_count"] > 1),
        "noindex_pages": sum(1 for r in results if r["robots_noindex"]),
        "missing_canonical_pages": sum(1 for r in results if not r["canonical_present"]),
        "avg_title_length": round(sum(title_lengths) / len(title_lengths), 1) if title_lengths else 0,
        "avg_meta_description_length": (
            round(sum(description_lengths) / len(description_lengths), 1) if description_lengths else 0
        ),
        "images_total": sum(r["images_total"] for r in results),
        "images_missing_alt": sum(r["images_missing_alt"] for r in results),
        "pages": results,
    }
