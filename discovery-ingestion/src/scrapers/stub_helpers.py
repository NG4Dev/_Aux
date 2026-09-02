"""Shared helpers for not-yet-wired scrapers — no fake sample rows."""

from __future__ import annotations

from typing import Any

from .base import BaseScraper, ScrapeResult


def finish_scrape_run(
    scraper: BaseScraper,
    result: ScrapeResult,
    run_id: int,
    *,
    status: str | None = None,
    error: str | None = None,
) -> None:
    if error:
        result.status = "failed"
        result.failed += 1
        scraper.finish_run(
            run_id,
            status="failed",
            records_found=0,
            records_inserted=0,
            error_message=error,
            metadata=_metadata(result),
        )
        result.errors.append(error)
        return

    final_status = status or "completed_with_warnings"
    result.status = final_status
    scraper.finish_run(
        run_id,
        status=final_status,
        records_found=0,
        records_inserted=0,
        metadata=_metadata(result),
    )


def _metadata(result: ScrapeResult) -> dict[str, Any]:
    return {
        "inserted": result.inserted,
        "updated": result.updated,
        "skipped": result.skipped,
        "not_implemented": True,
        "expected_total": result.expected_total,
        "pages_done": result.pages_done,
        "pages_total": result.pages_total,
    }


def scrape_not_implemented(
    scraper: BaseScraper,
    *,
    message: str,
) -> ScrapeResult:
    """Honest stub: report not wired yet without inserting placeholder catalog rows."""
    result = ScrapeResult(source_provider=scraper.source_provider, city_slug=scraper.city_slug)
    run_id = scraper.start_run()
    result.run_id = run_id
    result.errors.append(message)
    scraper.set_progress_total(1)
    scraper.emit_progress("not wired", "skipped", phase="stub")
    finish_scrape_run(scraper, result, run_id)
    return result
