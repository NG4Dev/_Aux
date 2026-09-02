"""Howler scraper — Algolia Event index (same backend as howler.co.za/active)."""

from __future__ import annotations

import json
import time
from typing import Any

from .base import BaseScraper, ScrapeResult, slugify, tally_outcome
from .howler_algolia import fetch_howler_events, resolve_algolia_config


class HowlerScraper(BaseScraper):
    source_provider = "howler"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id
        city_name = self.city["name"]

        rejected: list[dict[str, str]] = []
        city_assigned: dict[str, int] = {}

        try:
            config = self.selectors.get("algolia") or {}
            app_id, api_key = resolve_algolia_config(config)

            with self.http_client() as client:
                events, raw_total = fetch_howler_events(
                    app_id=app_id,
                    api_key=api_key,
                    client=client,
                    city_query=city_name,
                )

            if self.strict_city_filter:
                events = [e for e in events if e.get("assigned_city_slug") == self.city_slug]
            else:
                accepted: list[dict[str, Any]] = []
                for hit in events:
                    assigned = hit.get("assigned_city_slug")
                    if assigned:
                        accepted.append(hit)
                        city_assigned[assigned] = city_assigned.get(assigned, 0) + 1
                    elif len(rejected) < 25:
                        rejected.append(
                            {
                                "title": hit.get("name", "")[:120],
                                "url": hit.get("url", ""),
                                "reason": "no_city_match",
                            }
                        )
                events = accepted

            result.records = events
            result.expected_total = len(events)
            self.set_progress_total(len(events))

            if self.on_progress:
                self.on_progress(
                    0,
                    max(len(events), 1),
                    f"Algolia {raw_total} hits, {len(events)} with city assigned",
                    {"phase": "fetch", "outcome": "fetching", "city": self.city_slug},
                )

            for hit in events:
                external_id = hit["objectID"]
                raw: dict[str, Any] = hit.pop("_raw", hit)
                assigned_city = hit.get("assigned_city_slug") or self.city_slug
                event_id, outcome = self.upsert_event(
                    external_id,
                    hit["name"],
                    description=hit.get("description"),
                    location=hit.get("venue"),
                    start_datetime=hit.get("startDate"),
                    end_datetime=hit.get("endDate"),
                    external_ticketing_url=hit.get("url"),
                    image_url=hit.get("image"),
                    raw=raw,
                    city_slug=assigned_city,
                )
                tally_outcome(result, outcome)
                if event_id is not None and hit.get("url"):
                    self.add_source_link("event", event_id, hit["url"], source_external_id=external_id)
                    self.add_listing_signal("event", event_id, hit["url"], listing_title=hit["name"], raw=raw)

                organizer = hit.get("organizer")
                if event_id is not None and organizer:
                    org_ext = slugify(organizer)
                    artist_id, artist_outcome = self.upsert_artist(
                        f"howler-org-{org_ext}",
                        organizer,
                        raw={"name": organizer, "source": "howler_organiser"},
                        city_slug=assigned_city,
                    )
                    tally_outcome(result, artist_outcome)
                    if artist_id is not None:
                        self.link_performer(event_id, artist_id, sort_order=0)

                time.sleep(0.02)

            status = "completed" if events else "completed_with_warnings"
            if not events:
                result.errors.append(f"No Howler events with resolvable city ({raw_total} Algolia hits)")
            result.status = status
            self.finish_run(
                run_id,
                status=status,
                records_found=len(events),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
                    "expected_total": result.expected_total,
                    "raw_algolia_hits": raw_total,
                    "city_assigned": city_assigned,
                    "rejected_sample": rejected,
                    "sample_fallback": False,
                },
            )
        except Exception as exc:
            result.status = "failed"
            result.failed += 1
            self.finish_run(
                run_id,
                status="failed",
                records_found=len(result.records),
                records_inserted=result.inserted + result.updated,
                error_message=str(exc),
                metadata={"inserted": result.inserted, "updated": result.updated, "skipped": result.skipped},
            )
            result.errors.append(str(exc))

        return result
