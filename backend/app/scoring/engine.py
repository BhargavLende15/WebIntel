"""Deterministic, evidence-based website readiness scoring."""

from dataclasses import dataclass
from math import isfinite
from typing import Any


WEIGHTS: dict[str, float] = {
    "performance": 0.20,
    "seo": 0.20,
    "accessibility": 0.15,
    "security": 0.15,
    "ai_readiness": 0.15,
    "content_quality": 0.10,
    "mobile_experience": 0.05,
}


@dataclass(frozen=True)
class ScoringResult:
    overall_score: float
    grade: str
    confidence: float
    category_scores: dict[str, float]
    explanation: str


def _number(data: dict[str, Any], key: str) -> float | None:
    """Return a finite, non-negative numeric measurement, if available."""
    value = data.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    value = float(value)
    if value < 0 or value != value or value == float("inf"):
        return None
    return value


def _ratio(numerator: float, denominator: float) -> float | None:
    if denominator <= 0:
        return None
    return max(0.0, min(1.0, numerator / denominator))


def _score_from_penalties(
    data: dict[str, Any],
    rules: list[tuple[str, float]],
) -> float | None:
    """Score a category from observed issue counts and their weights."""
    observed = [
        (key, penalty)
        for key, penalty in rules
        if _number(data, key) is not None
    ]
    if not observed:
        return None

    penalty_total = sum(
        min(1.0, _number(data, key) or 0.0) * penalty
        for key, penalty in observed
    )
    available_weight = sum(penalty for _, penalty in observed)
    if available_weight <= 0:
        return None

    return round(100.0 * (1.0 - penalty_total / available_weight), 1)


def _grade(score: float) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def score_performance(data: dict[str, Any] | None) -> float | None:
    if not data or not _number(data, "pages_analyzed"):
        return None

    signals: list[float] = []

    ttfb = _number(data, "avg_ttfb_ms")
    if ttfb is not None:
        signals.append(max(0.0, min(100.0, 100.0 * (1.0 - ttfb / 2000.0))))

    response = _number(data, "avg_total_time_ms")
    if response is not None:
        signals.append(max(0.0, min(100.0, 100.0 * (1.0 - response / 5000.0))))

    size = _number(data, "avg_page_size_kb")
    if size is not None:
        signals.append(max(0.0, min(100.0, 100.0 * (1.0 - size / 5000.0))))

    if not signals:
        return None
    return round(sum(signals) / len(signals), 1)


def score_seo(data: dict[str, Any] | None) -> float | None:
    if not data or not _number(data, "pages_analyzed"):
        return None

    pages = _number(data, "pages_analyzed") or 0.0
    rules = [
        ("missing_title_pages", 0.30),
        ("missing_meta_description_pages", 0.20),
        ("multiple_h1_pages", 0.10),
        ("noindex_pages", 0.20),
        ("missing_canonical_pages", 0.10),
    ]

    observed = [
        (key, weight)
        for key, weight in rules
        if _number(data, key) is not None
    ]
    if not observed:
        return None

    penalty = sum(
        min(1.0, (_number(data, key) or 0.0) / pages) * weight
        for key, weight in observed
    )
    weight_total = sum(weight for _, weight in observed)
    return round(100.0 * (1.0 - penalty / weight_total), 1)


def score_accessibility(data: dict[str, Any] | None) -> float | None:
    """Score only accessibility signals with valid, applicable denominators."""
    if not data or not _number(data, "pages_analyzed"):
        return None

    signals: list[float] = []

    images = _number(data, "images_total")
    missing_alt = _number(data, "images_missing_alt")
    if images is not None and images > 0 and missing_alt is not None:
        ratio = _ratio(missing_alt, images)
        if ratio is not None:
            signals.append(100.0 * (1.0 - ratio))

    inputs = _number(data, "form_inputs_total")
    missing_labels = _number(data, "form_inputs_missing_label")
    if inputs is not None and inputs > 0 and missing_labels is not None:
        ratio = _ratio(missing_labels, inputs)
        if ratio is not None:
            signals.append(100.0 * (1.0 - ratio))

    pages = _number(data, "pages_analyzed")
    lang_missing = _number(data, "pages_missing_html_lang")
    if pages is not None and pages > 0 and lang_missing is not None:
        signals.append(
            100.0 * (1.0 - min(1.0, lang_missing / pages))
        )

    if not signals:
        return None
    return round(sum(signals) / len(signals), 1)
def score_security(data: dict[str, Any] | None) -> float | None:
    """Score HTTPS and valid observed security-header coverage ratios."""
    if not data or not _number(data, "pages_analyzed"):
        return None

    pages = _number(data, "pages_analyzed")
    if pages is None or pages <= 0:
        return None

    signals: list[float] = []

    https = _number(data, "https_pages")
    if https is not None:
        signals.append(100.0 * min(1.0, https / pages))

    headers = data.get("header_coverage")
    if isinstance(headers, dict) and headers:
        ratios = [
            float(value["ratio"])
            for value in headers.values()
            if isinstance(value, dict)
            and isinstance(value.get("ratio"), (int, float))
            and not isinstance(value.get("ratio"), bool)
            and isfinite(value["ratio"])
            and 0.0 <= value["ratio"] <= 1.0
        ]
        if ratios:
            signals.append(100.0 * sum(ratios) / len(ratios))

    if not signals:
        return None
    return round(sum(signals) / len(signals), 1)
def score_ai_readiness(data: dict[str, Any] | None) -> float | None:
    """Score observed discoverability signals without requiring optional files."""
    if not data or not _number(data, "pages_analyzed"):
        return None

    signals: list[float] = []

    # A sitemap supports URL discovery. llms.txt is optional, and robots.txt
    # absence alone is not evidence that a crawler is blocked.
    if isinstance(data.get("sitemap_xml_found"), bool):
        signals.append(100.0 if data["sitemap_xml_found"] else 0.0)

    pages = _number(data, "pages_analyzed")
    for key in ("structured_data_pages", "semantic_html_pages"):
        value = _number(data, key)
        if value is not None and pages is not None and pages > 0:
            signals.append(100.0 * min(1.0, value / pages))

    coverage = _number(data, "meta_description_coverage")
    if coverage is not None:
        signals.append(100.0 * min(1.0, coverage))

    rules = data.get("ai_crawler_access")
    if isinstance(rules, dict) and rules:
        meaningful = [
            value for value in rules.values()
            if value in {"allowed", "disallowed"}
        ]
        if meaningful:
            signals.append(
                100.0 * sum(value == "allowed" for value in meaningful)
                / len(meaningful)
            )

    if not signals:
        return None
    return round(sum(signals) / len(signals), 1)
def score_content(data: dict[str, Any] | None) -> float | None:
    if not data or not _number(data, "pages_analyzed"):
        return None

    pages = _number(data, "pages_analyzed") or 0.0
    signals: list[float] = []

    word_count = _number(data, "avg_word_count")
    if word_count is not None:
        signals.append(min(100.0, word_count / 600.0 * 100.0))

    thin = _number(data, "thin_content_pages")
    if thin is not None:
        signals.append(100.0 * (1.0 - min(1.0, thin / pages)))

    for key in ("duplicate_titles", "duplicate_meta_descriptions"):
        duplicates = _number(data, key)
        if duplicates is not None:
            signals.append(100.0 * (1.0 - min(1.0, duplicates / pages)))

    if not signals:
        return None
    return round(sum(signals) / len(signals), 1)


def score_mobile(data: dict[str, Any] | None) -> float | None:
    if not data or not _number(data, "pages_analyzed"):
        return None

    pages = _number(data, "pages_analyzed") or 0.0
    signals: list[float] = []

    for key in ("viewport_missing_pages", "non_responsive_viewport_pages"):
        value = _number(data, key)
        if value is not None:
            signals.append(100.0 * (1.0 - min(1.0, value / pages)))

    if not signals:
        return None
    return round(sum(signals) / len(signals), 1)


def calculate_score(analysis: Any) -> ScoringResult:
    """Calculate a readiness score from a completed AnalysisResult-like object."""
    if getattr(analysis, "status", None) != "completed":
        raise ValueError("Only completed analyses can be scored.")

    category_data = {
        "performance": getattr(analysis, "performance_data", None),
        "seo": getattr(analysis, "seo_data", None),
        "accessibility": getattr(analysis, "accessibility_data", None),
        "security": getattr(analysis, "security_data", None),
        "ai_readiness": getattr(analysis, "ai_readiness_data", None),
        "content_quality": getattr(analysis, "content_data", None),
        "mobile_experience": getattr(analysis, "mobile_data", None),
    }

    scorers = {
        "performance": score_performance,
        "seo": score_seo,
        "accessibility": score_accessibility,
        "security": score_security,
        "ai_readiness": score_ai_readiness,
        "content_quality": score_content,
        "mobile_experience": score_mobile,
    }

    category_scores: dict[str, float] = {}
    for category, scorer in scorers.items():
        score = scorer(category_data[category])
        if score is not None:
            category_scores[category] = score

    if not category_scores:
        raise ValueError("No usable metrics are available to calculate a score.")

    available_weight = sum(WEIGHTS[key] for key in category_scores)
    overall = sum(
        category_scores[key] * WEIGHTS[key]
        for key in category_scores
    ) / available_weight

    coverage = available_weight
    explanation = (
        f"Rule-based readiness score calculated from {len(category_scores)} "
        f"of {len(WEIGHTS)} categories. Weighted measurement coverage: "
        f"{coverage:.0%}. Scores are heuristic indicators, not a ranking prediction."
    )

    return ScoringResult(
        overall_score=round(overall, 1),
        grade=_grade(overall),
        confidence=round(coverage, 2),
        category_scores=category_scores,
        explanation=explanation,
    )
