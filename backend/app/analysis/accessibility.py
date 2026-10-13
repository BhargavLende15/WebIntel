from app.analysis.parser import PageData


def analyze_page(page: PageData) -> dict:
    images_total = len(page.images)
    images_missing_alt = sum(1 for image in page.images if not image.alt or not image.alt.strip())
    inputs_total = sum(form.input_count for form in page.forms)
    inputs_missing_label = sum(form.inputs_missing_label for form in page.forms)
    return {
        "url": page.url,
        "html_lang_present": bool(page.html_lang),
        "html_lang": page.html_lang,
        "images_total": images_total,
        "images_missing_alt": images_missing_alt,
        "form_inputs_total": inputs_total,
        "form_inputs_missing_label": inputs_missing_label,
        "iframes_missing_title": page.iframes_missing_title,
        "heading_order_skips": page.heading_order_skips,
        "generic_link_texts": page.generic_link_count,
    }


def aggregate(results: list[dict]) -> dict:
    pages = len(results)
    if pages == 0:
        return {"pages_analyzed": 0}
    return {
        "pages_analyzed": pages,
        "pages_missing_html_lang": sum(1 for r in results if not r["html_lang_present"]),
        "images_total": sum(r["images_total"] for r in results),
        "images_missing_alt": sum(r["images_missing_alt"] for r in results),
        "form_inputs_total": sum(r["form_inputs_total"] for r in results),
        "form_inputs_missing_label": sum(r["form_inputs_missing_label"] for r in results),
        "iframes_missing_title": sum(r["iframes_missing_title"] for r in results),
        "pages_with_heading_skips": sum(1 for r in results if r["heading_order_skips"] > 0),
        "generic_link_texts": sum(r["generic_link_texts"] for r in results),
        "pages": results,
    }
