from collections import Counter

from app.analysis.parser import PageData

THIN_CONTENT_WORD_COUNT = 300


def analyze_page(page: PageData) -> dict:
    ratio = round(page.text_length / page.html_length, 3) if page.html_length else 0.0
    return {
        "url": page.url,
        "title": page.title,
        "meta_description": page.meta_description,
        "word_count": page.word_count,
        "paragraph_count": page.paragraph_count,
        "text_html_ratio": ratio,
        "thin_content": page.word_count < THIN_CONTENT_WORD_COUNT,
    }


def aggregate(results: list[dict]) -> dict:
    pages = len(results)
    if pages == 0:
        return {"pages_analyzed": 0}
    return {
        "pages_analyzed": pages,
        "avg_word_count": round(sum(r["word_count"] for r in results) / pages, 1),
        "min_word_count": min(r["word_count"] for r in results),
        "max_word_count": max(r["word_count"] for r in results),
        "thin_content_pages": sum(1 for r in results if r["thin_content"]),
        "avg_text_html_ratio": round(sum(r["text_html_ratio"] for r in results) / pages, 3),
        "duplicate_titles": count_duplicates([r["title"] for r in results]),
        "duplicate_meta_descriptions": count_duplicates([r["meta_description"] for r in results]),
        "pages": results,
    }


def count_duplicates(values: list[str | None]) -> int:
    counts = Counter(value.strip().lower() for value in values if value)
    return sum(count - 1 for count in counts.values() if count > 1)
