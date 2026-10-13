import logging
import time
import traceback
from datetime import datetime, timezone
from uuid import UUID

from app.analysis import accessibility, ai_readiness, content, mobile, performance, security, seo
from app.database.session import SessionLocal
from app.models import AnalysisResult
from app.services.crawler import CrawlResult, crawl_site
from app.services.fetcher import build_client
from app.utils.config import settings

logger = logging.getLogger(__name__)

MAX_ERROR_MESSAGE_LENGTH = 4000


def _analyze_pages(crawl: CrawlResult) -> tuple[dict, dict, dict, dict, dict, dict]:
    parsed_pages = [page.parsed for page in crawl.successful_pages]
    crawled_ok = [page for page in crawl.successful_pages]

    seo_page_results = [seo.analyze_page(p) for p in parsed_pages]
    content_page_results = [content.analyze_page(p) for p in parsed_pages]
    accessibility_page_results = [accessibility.analyze_page(p) for p in parsed_pages]
    mobile_page_results = [mobile.analyze_page(p) for p in parsed_pages]
    security_page_results = [security.analyze_page(p) for p in crawled_ok]
    performance_page_results = [performance.analyze_page(p) for p in crawled_ok]

    return (
        seo.aggregate(seo_page_results),
        content.aggregate(content_page_results),
        accessibility.aggregate(accessibility_page_results),
        mobile.aggregate(mobile_page_results),
        security.aggregate(security_page_results),
        performance.aggregate(performance_page_results),
    )


def _build_raw_metrics(crawl: CrawlResult, duration_ms: float) -> dict:
    return {
        "crawl": {
            "start_url": crawl.start_url,
            "domain": crawl.domain,
            "pages_crawled": len(crawl.pages),
            "pages_succeeded": len(crawl.successful_pages),
            "discovered_urls": crawl.discovered_count,
            "skipped_by_robots": crawl.skipped_by_robots,
            "max_pages_reached": crawl.max_pages_reached,
            "deadline_exceeded": crawl.deadline_exceeded,
            "max_pages_config": settings.MAX_CRAWL_PAGES,
            "duration_ms": round(duration_ms, 1),
            "robots_txt_found": crawl.robots.fetched,
            "errors": crawl.errors[:20],
        },
        "pages": [
            {
                "url": page.url,
                "status_code": page.fetch.status_code,
                "ok": page.fetch.ok,
                "error": page.fetch.error,
                "title": page.parsed.title if page.parsed else None,
                "word_count": page.parsed.word_count if page.parsed else None,
            }
            for page in crawl.pages
        ],
    }


def run_analysis(analysis_id: UUID) -> None:
    db = SessionLocal()
    try:
        analysis = db.get(AnalysisResult, analysis_id)
        if analysis is None:
            logger.warning("Analysis %s no longer exists; skipping", analysis_id)
            return
        website_url = analysis.website.url

        analysis.status = "running"
        db.commit()

        started = time.perf_counter()
        client = build_client()
        try:
            crawl = crawl_site(website_url, client=client)
            if not crawl.successful_pages:
                last_error = crawl.errors[-1] if crawl.errors else "no response received"
                raise RuntimeError(f"No pages could be fetched from {website_url} ({last_error})")

            (
                seo_data,
                content_data,
                accessibility_data,
                mobile_data,
                security_data,
                performance_data,
            ) = _analyze_pages(crawl)
            ai_readiness_data = ai_readiness.analyze_site(crawl, client)
        finally:
            client.close()
        duration_ms = (time.perf_counter() - started) * 1000

        analysis.seo_data = seo_data
        analysis.content_data = content_data
        analysis.accessibility_data = accessibility_data
        analysis.mobile_data = mobile_data
        analysis.security_data = security_data
        analysis.performance_data = performance_data
        analysis.ai_readiness_data = ai_readiness_data
        analysis.raw_metrics = _build_raw_metrics(crawl, duration_ms)
        analysis.status = "completed"
        analysis.completed_at = datetime.now(timezone.utc)
        analysis.error_message = None
        analysis.website.last_analyzed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Analysis %s completed in %.0f ms (%s pages)", analysis_id, duration_ms, len(crawl.pages))
    except Exception as exc:
        db.rollback()
        try:
            analysis = db.get(AnalysisResult, analysis_id)
            if analysis is not None:
                analysis.status = "failed"
                analysis.completed_at = datetime.now(timezone.utc)
                analysis.error_message = _format_error(exc)
                db.commit()
        except Exception:
            logger.exception("Failed to persist error state for analysis %s", analysis_id)
        logger.exception("Analysis %s failed", analysis_id)
    finally:
        db.close()


def _format_error(exc: Exception) -> str:
    tb = traceback.format_exc()
    message = f"{type(exc).__name__}: {exc}\n{tb}"
    return message[:MAX_ERROR_MESSAGE_LENGTH]
