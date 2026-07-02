"""Scrape orchestrator — routes city + source to scraper implementations."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Type

from src.db.connection import init_db
from src.pipeline.completion import build_run_metadata, count_entities_for_source, entity_table_for_source
from src.scrapers.airdosh import AirdoshScraper
from src.scrapers.bandsintown import BandsInTownScraper
from src.scrapers.base import BaseScraper, ProgressCallback, ScrapeResult, load_cities
from src.scrapers.computicket import ComputicketScraper
from src.scrapers.fever import FeverScraper
from src.scrapers.fomosa import FomosaScraper
from src.scrapers.google_places import GooglePlacesScraper
from src.scrapers.howler import HowlerScraper
from src.scrapers.hyperli import HyperliScraper
from src.scrapers.menu_web import MenuWebScraper
from src.scrapers.quicket import QuicketScraper
from src.scrapers.webtickets import WebticketsScraper

SCRAPER_REGISTRY: dict[str, Type[BaseScraper]] = {
    "quicket": QuicketScraper,
    "google_places": GooglePlacesScraper,
    "bandsintown": BandsInTownScraper,
    "computicket": ComputicketScraper,
    "howler": HowlerScraper,
    "webtickets": WebticketsScraper,
    "fever": FeverScraper,
    "airdosh": AirdoshScraper,
    "fomosa": FomosaScraper,
    "hyperli": HyperliScraper,
    "menu_web": MenuWebScraper,
}

# Plan build order
SCRAPE_ORDER = [
    "quicket",
    "airdosh",
    "bandsintown",
    "webtickets",
    "fomosa",
    "hyperli",
    "howler",
    "fever",
    "computicket",
    "google_places",
    "menu_web",
]

ALL_SOURCES = list(SCRAPER_REGISTRY.keys())


def run_scrape(
    city_slug: str,
    source: str,
    conn: sqlite3.Connection | None = None,
    *,
    on_progress: ProgressCallback | None = None,
    force: bool = False,
    incremental: bool = False,
    strict_city_filter: bool = False,
) -> ScrapeResult:
    if source not in SCRAPER_REGISTRY:
        raise ValueError(f"Unknown source: {source}. Available: {', '.join(ALL_SOURCES)}")

    cities = load_cities()
    if city_slug not in cities:
        raise ValueError(f"Unknown city: {city_slug}. Available: {', '.join(cities.keys())}")

    db = conn or init_db()
    scraper_cls = SCRAPER_REGISTRY[source]
    scraper = scraper_cls(
        city_slug,
        db,
        force=force,
        incremental=incremental if source == "google_places" else False,
        on_progress=on_progress,
        strict_city_filter=strict_city_filter,
    )
    result = scraper.scrape()
    result.started_at = result.started_at or datetime.now(timezone.utc)
    result.finished_at = datetime.now(timezone.utc)

    scraper_meta: dict[str, Any] = {}
    if result.run_id:
        meta_row = db.execute(
            "SELECT metadata_json FROM scrape_runs WHERE id = ?",
            (result.run_id,),
        ).fetchone()
        if meta_row and meta_row["metadata_json"]:
            try:
                scraper_meta = json.loads(meta_row["metadata_json"])
            except json.JSONDecodeError:
                scraper_meta = {}

    entity_table = entity_table_for_source(source)
    in_db_after = count_entities_for_source(
        db, source=source, city_slug=city_slug, entity_table=entity_table
    )
    skipped_fresh = result.skipped
    result.metadata = build_run_metadata(
        inserted=result.inserted,
        updated=result.updated,
        skipped=result.skipped,
        skipped_fresh=skipped_fresh,
        failed=result.failed,
        records_found=result.records_found,
        expected_total=result.expected_total,
        pages_done=result.pages_done,
        pages_total=result.pages_total,
        sample_fallback=result.sample_fallback,
        in_db_after=in_db_after,
    )
    result.metadata.update(scraper_meta)
    if result.run_id:
        db.execute(
            "UPDATE scrape_runs SET metadata_json = ? WHERE id = ?",
            (json.dumps(result.metadata), result.run_id),
        )
        db.commit()
    return result


def run_scrape_all(
    city_slug: str,
    conn: sqlite3.Connection | None = None,
    *,
    on_progress: ProgressCallback | None = None,
    force: bool = False,
    sources: list[str] | None = None,
    strict_city_filter: bool = False,
) -> list[ScrapeResult]:
    order = sources or SCRAPE_ORDER
    results: list[ScrapeResult] = []
    db = conn or init_db()
    for source in order:
        if source not in SCRAPER_REGISTRY:
            continue
        results.append(
            run_scrape(
                city_slug,
                source,
                conn=db,
                on_progress=on_progress,
                force=force,
                strict_city_filter=strict_city_filter,
            )
        )
    return results
