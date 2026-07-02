"""Base scraper with shared Playwright/httpx patterns."""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
import yaml
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = PROJECT_ROOT / "config"

ProgressCallback = Callable[[int, int, str, dict[str, Any]], None]


def content_hash(raw: dict[str, Any] | None) -> str:
    if not raw:
        return ""
    payload = json.dumps(raw, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]


def scrape_ttl_days() -> int:
    return int(os.getenv("SCRAPE_TTL_DAYS", "7"))


@dataclass
class ScrapeResult:
    source_provider: str
    city_slug: str
    run_id: int | None = None
    status: str = "completed"
    records: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    expected_total: int | None = None
    pages_done: int = 0
    pages_total: int | None = None
    sample_fallback: bool = False
    started_at: datetime | None = None
    finished_at: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def records_found(self) -> int:
        return len(self.records)


def tally_outcome(result: ScrapeResult, outcome: str) -> None:
    if outcome == "inserted":
        result.inserted += 1
    elif outcome == "updated":
        result.updated += 1
    elif outcome == "skipped":
        result.skipped += 1
    elif outcome == "failed":
        result.failed += 1


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-") or "unknown"


def load_cities() -> dict[str, dict[str, Any]]:
    with open(CONFIG_DIR / "cities.yaml", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("cities", {})


def load_selectors(source: str) -> dict[str, Any]:
    with open(CONFIG_DIR / "scraper_selectors.yaml", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("sources", {}).get(source, {})


class BaseScraper(ABC):
    source_provider: str = "base"

    def __init__(
        self,
        city_slug: str,
        conn: sqlite3.Connection,
        *,
        force: bool = False,
        incremental: bool = False,
        on_progress: ProgressCallback | None = None,
        strict_city_filter: bool = False,
    ):
        self.city_slug = city_slug
        self.conn = conn
        self.force = force
        self.incremental = incremental
        self.on_progress = on_progress
        self.strict_city_filter = strict_city_filter
        self._progress_done = 0
        self._progress_total = 0
        self.cities = load_cities()
        if city_slug not in self.cities:
            raise ValueError(f"Unknown city slug: {city_slug}")
        self.city = self.cities[city_slug]
        self.selectors = load_selectors(self.source_provider)
        self.headless = os.getenv("SCRAPER_HEADLESS", "true").lower() != "false"
        self.pause_on_captcha = (
            os.getenv("SCRAPER_PAUSE_ON_CAPTCHA", "false").lower() == "true"
        )

    @abstractmethod
    def scrape(self) -> ScrapeResult:
        ...

    def resolve_city_for_record(self, *text_blobs: str | None) -> tuple[str | None, str]:
        from .city_filter import assign_city_or_skip

        return assign_city_or_skip(
            *text_blobs,
            strict_city=self.city_slug if self.strict_city_filter else None,
            strict_city_name=self.city["name"] if self.strict_city_filter else None,
        )

    def http_client(self, timeout: float = 30.0) -> httpx.Client:
        return httpx.Client(
            timeout=timeout,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json, text/html, */*",
            },
            follow_redirects=True,
        )

    def playwright_context(self, *, stealth: bool = True):
        from playwright.sync_api import sync_playwright

        pw = sync_playwright().start()
        launch_args: list[str] = []
        if stealth:
            launch_args.append("--disable-blink-features=AutomationControlled")
        browser = pw.chromium.launch(headless=self.headless, args=launch_args)
        user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        )
        context = browser.new_context(
            user_agent=user_agent,
            locale="en-US",
            viewport={"width": 1366, "height": 768},
        )
        if stealth:
            context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
            )
        return pw, browser, context

    def pause_for_captcha(self, page) -> None:
        if self.pause_on_captcha:
            print("[CAPTCHA] Solve manually in browser, then press Enter...")
            input()

    def set_progress_total(self, total: int) -> None:
        self._progress_total = max(total, 0)

    def emit_progress(
        self,
        label: str,
        outcome: str,
        *,
        skip_reason: str | None = None,
        phase: str | None = None,
        sample_fallback: bool = False,
    ) -> None:
        self._progress_done += 1
        if self.on_progress:
            info: dict[str, Any] = {
                "outcome": outcome,
                "city": self.city_slug,
                "source": self.source_provider,
            }
            if skip_reason:
                info["skip_reason"] = skip_reason
            if phase:
                info["phase"] = phase
            if sample_fallback:
                info["sample_fallback"] = True
            total = self._progress_total or self._progress_done
            self.on_progress(self._progress_done, total, label, info)

    def _get_existing_row(self, table: str, external_id: str) -> sqlite3.Row | None:
        return self.conn.execute(
            f"""
            SELECT id, content_hash, last_scraped_at
            FROM {table}
            WHERE source_provider = ? AND source_external_id = ?
            """,
            (self.source_provider, external_id),
        ).fetchone()

    def should_skip(self, table: str, external_id: str, raw: dict[str, Any] | None) -> tuple[bool, str]:
        if self.force:
            return False, "fetch"
        existing = self._get_existing_row(table, external_id)
        if existing is None:
            return False, "fetch"
        new_hash = content_hash(raw)
        old_hash = existing["content_hash"]
        if not new_hash or new_hash != old_hash:
            return False, "fetch"
        last_scraped = existing["last_scraped_at"]
        if last_scraped and self._within_ttl(last_scraped):
            return True, "fresh"
        return True, "unchanged"

    def _within_ttl(self, last_scraped_at: str) -> bool:
        try:
            parsed = datetime.fromisoformat(last_scraped_at.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            age = datetime.now(timezone.utc) - parsed
            return age <= timedelta(days=scrape_ttl_days())
        except ValueError:
            return False

    def upsert_event(
        self,
        external_id: str,
        name: str,
        *,
        description: str | None = None,
        location: str | None = None,
        start_datetime: str | None = None,
        end_datetime: str | None = None,
        timezone: str | None = None,
        date_precision: str = "datetime",
        external_ticketing_url: str | None = None,
        image_url: str | None = None,
        organizer_id: int | None = None,
        venue_place_id: int | None = None,
        rsvp_count: int | None = None,
        raw: dict[str, Any] | None = None,
        city_slug: str | None = None,
    ) -> tuple[int | None, str]:
        skip, skip_reason = self.should_skip("events", external_id, raw)
        if skip:
            self.emit_progress(name, "skipped", skip_reason=skip_reason)
            return None, "skipped"

        target_city = city_slug or self.city_slug
        existing = self._get_existing_row("events", external_id)
        outcome = "inserted" if existing is None else "updated"
        row_hash = content_hash(raw)
        tz = timezone or self.city.get("timezone", "Africa/Johannesburg")
        slug = slugify(name)
        raw_json = json.dumps(raw) if raw else None
        self.conn.execute(
            """
            INSERT INTO events (
                source_provider, source_external_id, city_slug, slug, name,
                description, location, start_datetime, end_datetime, timezone,
                date_precision, organizer_id, venue_place_id,
                external_ticketing_url, image_url, rsvp_count, raw_json,
                content_hash, last_scraped_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(source_provider, source_external_id) DO UPDATE SET
                city_slug = excluded.city_slug,
                name = excluded.name,
                description = excluded.description,
                location = excluded.location,
                start_datetime = excluded.start_datetime,
                end_datetime = excluded.end_datetime,
                timezone = excluded.timezone,
                date_precision = excluded.date_precision,
                external_ticketing_url = excluded.external_ticketing_url,
                image_url = excluded.image_url,
                rsvp_count = excluded.rsvp_count,
                raw_json = excluded.raw_json,
                content_hash = excluded.content_hash,
                last_scraped_at = datetime('now'),
                updated_at = datetime('now')
            """,
            (
                self.source_provider,
                external_id,
                target_city,
                slug,
                name,
                description,
                location,
                start_datetime,
                end_datetime,
                tz,
                date_precision,
                organizer_id,
                venue_place_id,
                external_ticketing_url,
                image_url,
                rsvp_count,
                raw_json,
                row_hash,
            ),
        )
        row = self.conn.execute(
            "SELECT id FROM events WHERE source_provider = ? AND source_external_id = ?",
            (self.source_provider, external_id),
        ).fetchone()
        event_id = int(row["id"])
        self.emit_progress(name, outcome)
        return event_id, outcome

    def upsert_place(
        self,
        external_id: str,
        name: str,
        *,
        description: str | None = None,
        place_kind: str = "venue",
        address: str | None = None,
        lat: float | None = None,
        lng: float | None = None,
        website: str | None = None,
        google_maps_url: str | None = None,
        phone: str | None = None,
        google_raw_json: dict[str, Any] | None = None,
        photo_urls: list[str] | None = None,
        raw: dict[str, Any] | None = None,
    ) -> tuple[int | None, str]:
        merged_raw = raw or {"name": name, "external_id": external_id}
        skip, skip_reason = self.should_skip("places", external_id, merged_raw)
        if skip:
            self.emit_progress(name, "skipped", skip_reason=skip_reason)
            return None, "skipped"

        existing = self._get_existing_row("places", external_id)
        outcome = "inserted" if existing is None else "updated"
        row_hash = content_hash(merged_raw)
        slug = slugify(name)
        self.conn.execute(
            """
            INSERT INTO places (
                source_provider, source_external_id, city_slug, slug, name,
                description, place_kind, address, lat, lng, website,
                google_maps_url, phone, google_raw_json, photo_urls_json, raw_json,
                content_hash, last_scraped_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(source_provider, source_external_id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                address = excluded.address,
                lat = excluded.lat,
                lng = excluded.lng,
                website = excluded.website,
                google_maps_url = excluded.google_maps_url,
                phone = excluded.phone,
                google_raw_json = excluded.google_raw_json,
                photo_urls_json = excluded.photo_urls_json,
                raw_json = excluded.raw_json,
                content_hash = excluded.content_hash,
                last_scraped_at = datetime('now'),
                updated_at = datetime('now')
            """,
            (
                self.source_provider,
                external_id,
                self.city_slug,
                slug,
                name,
                description,
                place_kind,
                address,
                lat,
                lng,
                website,
                google_maps_url,
                phone,
                json.dumps(google_raw_json) if google_raw_json else None,
                json.dumps(photo_urls) if photo_urls else None,
                json.dumps(raw) if raw else None,
                row_hash,
            ),
        )
        row = self.conn.execute(
            "SELECT id FROM places WHERE source_provider = ? AND source_external_id = ?",
            (self.source_provider, external_id),
        ).fetchone()
        place_id = int(row["id"])
        self.emit_progress(name, outcome)
        return place_id, outcome

    def upsert_artist(
        self,
        external_id: str,
        name: str,
        *,
        bio: str | None = None,
        genre: str | None = None,
        image_url: str | None = None,
        social_links: dict[str, str] | None = None,
        raw: dict[str, Any] | None = None,
        city_slug: str | None = None,
    ) -> tuple[int | None, str]:
        merged_raw = raw or {"name": name, "external_id": external_id}
        skip, skip_reason = self.should_skip("artists", external_id, merged_raw)
        if skip:
            self.emit_progress(name, "skipped", skip_reason=skip_reason)
            return None, "skipped"

        target_city = city_slug or self.city_slug
        existing = self._get_existing_row("artists", external_id)
        outcome = "inserted" if existing is None else "updated"
        row_hash = content_hash(merged_raw)
        slug = slugify(name)
        self.conn.execute(
            """
            INSERT INTO artists (
                source_provider, source_external_id, city_slug, slug, name,
                bio, genre, image_url, social_links_json, raw_json,
                content_hash, last_scraped_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(source_provider, source_external_id) DO UPDATE SET
                city_slug = excluded.city_slug,
                name = excluded.name,
                bio = excluded.bio,
                genre = excluded.genre,
                image_url = excluded.image_url,
                social_links_json = excluded.social_links_json,
                raw_json = excluded.raw_json,
                content_hash = excluded.content_hash,
                last_scraped_at = datetime('now'),
                updated_at = datetime('now')
            """,
            (
                self.source_provider,
                external_id,
                target_city,
                slug,
                name,
                bio,
                genre,
                image_url,
                json.dumps(social_links) if social_links else None,
                json.dumps(raw) if raw else None,
                row_hash,
            ),
        )
        row = self.conn.execute(
            "SELECT id FROM artists WHERE source_provider = ? AND source_external_id = ?",
            (self.source_provider, external_id),
        ).fetchone()
        artist_id = int(row["id"])
        self.emit_progress(name, outcome)
        return artist_id, outcome

    def upsert_deal(
        self,
        external_id: str,
        title: str,
        *,
        description: str | None = None,
        price_cents: int | None = None,
        merchant_name: str | None = None,
        image_url: str | None = None,
        deal_url: str | None = None,
        valid_until: str | None = None,
        raw: dict[str, Any] | None = None,
        city_slug: str | None = None,
    ) -> tuple[int | None, str]:
        merged_raw = raw or {"title": title, "external_id": external_id}
        skip, skip_reason = self.should_skip("deals", external_id, merged_raw)
        if skip:
            self.emit_progress(title, "skipped", skip_reason=skip_reason)
            return None, "skipped"

        target_city = city_slug or self.city_slug
        existing = self._get_existing_row("deals", external_id)
        outcome = "inserted" if existing is None else "updated"
        row_hash = content_hash(merged_raw)
        slug = slugify(title)
        self.conn.execute(
            """
            INSERT INTO deals (
                source_provider, source_external_id, city_slug, slug, title,
                description, price_cents, merchant_name, image_url, deal_url,
                valid_until, raw_json, content_hash, last_scraped_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(source_provider, source_external_id) DO UPDATE SET
                city_slug = excluded.city_slug,
                title = excluded.title,
                description = excluded.description,
                price_cents = excluded.price_cents,
                merchant_name = excluded.merchant_name,
                image_url = excluded.image_url,
                deal_url = excluded.deal_url,
                valid_until = excluded.valid_until,
                raw_json = excluded.raw_json,
                content_hash = excluded.content_hash,
                last_scraped_at = datetime('now'),
                updated_at = datetime('now')
            """,
            (
                self.source_provider,
                external_id,
                target_city,
                slug,
                title,
                description,
                price_cents,
                merchant_name,
                image_url,
                deal_url,
                valid_until,
                json.dumps(raw) if raw else None,
                row_hash,
            ),
        )
        row = self.conn.execute(
            "SELECT id FROM deals WHERE source_provider = ? AND source_external_id = ?",
            (self.source_provider, external_id),
        ).fetchone()
        deal_id = int(row["id"])
        self.emit_progress(title, outcome)
        return deal_id, outcome

    def add_source_link(
        self,
        entity_type: str,
        entity_id: int,
        url: str,
        *,
        source_external_id: str | None = None,
        link_type: str = "listing",
    ) -> None:
        self.conn.execute(
            """
            INSERT OR IGNORE INTO source_links (
                entity_type, entity_id, source_provider, source_external_id, url, link_type
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                entity_type,
                entity_id,
                self.source_provider,
                source_external_id,
                url,
                link_type,
            ),
        )

    def add_listing_signal(
        self,
        entity_type: str,
        entity_id: int,
        listing_url: str,
        *,
        listing_title: str | None = None,
        raw: dict[str, Any] | None = None,
    ) -> None:
        self.conn.execute(
            """
            INSERT INTO listing_signals (
                entity_type, entity_id, source_provider, listing_url,
                listing_title, last_seen_at, raw_json
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
            ON CONFLICT(entity_type, entity_id, source_provider, listing_url) DO UPDATE SET
                listing_title = excluded.listing_title,
                last_seen_at = datetime('now'),
                raw_json = excluded.raw_json
            """,
            (
                entity_type,
                entity_id,
                self.source_provider,
                listing_url,
                listing_title,
                json.dumps(raw) if raw else None,
            ),
        )

    def link_performer(self, event_id: int, artist_id: int, sort_order: int = 0) -> None:
        self.conn.execute(
            """
            INSERT OR IGNORE INTO event_performers (event_id, artist_id, sort_order)
            VALUES (?, ?, ?)
            """,
            (event_id, artist_id, sort_order),
        )

    def start_run(self) -> int:
        cur = self.conn.execute(
            """
            INSERT INTO scrape_runs (source_provider, city_slug, status)
            VALUES (?, ?, 'running')
            """,
            (self.source_provider, self.city_slug),
        )
        return int(cur.lastrowid)

    def finish_run(
        self,
        run_id: int,
        *,
        status: str,
        records_found: int,
        records_inserted: int,
        error_message: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.conn.execute(
            """
            UPDATE scrape_runs SET
                finished_at = datetime('now'),
                status = ?,
                records_found = ?,
                records_inserted = ?,
                error_message = ?,
                metadata_json = ?
            WHERE id = ?
            """,
            (
                status,
                records_found,
                records_inserted,
                error_message,
                json.dumps(metadata) if metadata else None,
                run_id,
            ),
        )
        self.conn.commit()

    @staticmethod
    def now_iso() -> str:
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
