"""AirDosh scraper — tickets.airdosh.co.za public event listings."""

from __future__ import annotations

import time
from typing import Any

from .airdosh_parser import LIST_URL, parse_event_html, fetch_listing_urls
from .base import BaseScraper, ScrapeResult, slugify, tally_outcome


class AirdoshScraper(BaseScraper):
    source_provider = "airdosh"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id

        rejected: list[dict[str, str]] = []
        city_assigned: dict[str, int] = {}
        city_unknown = 0

        pw = browser = context = page = None
        try:
            pw, browser, context = self.playwright_context()
            page = context.new_page()
            page.goto(LIST_URL, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(8000)

            listing = fetch_listing_urls(page)
            unique_urls = list(dict.fromkeys(item["href"] for item in listing))
            result.expected_total = len(unique_urls)
            self.set_progress_total(len(unique_urls))

            if self.on_progress:
                self.on_progress(
                    0,
                    max(len(unique_urls), 1),
                    f"Found {len(unique_urls)} events on tickets.airdosh.co.za",
                    {"phase": "list", "outcome": "fetching", "city": self.city_slug},
                )

            parsed_events: list[dict[str, Any]] = []
            with self.http_client() as client:
                for idx, url in enumerate(unique_urls, start=1):
                    resp = client.get(url)
                    resp.raise_for_status()
                    event = parse_event_html(resp.text, url)
                    if not event:
                        result.errors.append(f"Could not parse event page: {url}")
                        continue

                    assigned_city, reason = self.resolve_city_for_record(
                        event.get("title"),
                        event.get("location"),
                        event.get("address"),
                        event.get("description"),
                    )
                    if assigned_city is None:
                        city_unknown += 1
                        if len(rejected) < 25:
                            rejected.append(
                                {
                                    "title": event.get("title", "")[:120],
                                    "url": url,
                                    "reason": reason,
                                }
                            )
                        continue

                    event["assigned_city_slug"] = assigned_city
                    event["city_assignment_reason"] = reason
                    parsed_events.append(event)
                    city_assigned[assigned_city] = city_assigned.get(assigned_city, 0) + 1

                    if self.on_progress:
                        self.on_progress(
                            idx,
                            len(unique_urls),
                            event["title"],
                            {"phase": "detail", "outcome": "fetching", "city": assigned_city},
                        )
                    time.sleep(0.15)

            result.records = parsed_events
            self.set_progress_total(len(parsed_events) or 1)

            for event in parsed_events:
                external_id = event["external_id"]
                raw = dict(event)
                event_id, outcome = self.upsert_event(
                    external_id,
                    event["title"],
                    description=event.get("description"),
                    location=event.get("location"),
                    start_datetime=event.get("start_datetime"),
                    end_datetime=event.get("end_datetime"),
                    external_ticketing_url=event.get("url"),
                    image_url=event.get("image_url"),
                    raw=raw,
                    city_slug=event["assigned_city_slug"],
                )
                tally_outcome(result, outcome)
                if event_id is not None and event.get("url"):
                    self.add_source_link("event", event_id, event["url"], source_external_id=external_id)
                    self.add_listing_signal(
                        "event", event_id, event["url"], listing_title=event["title"], raw=raw
                    )
                organizer = event.get("organizer")
                if event_id is not None and organizer:
                    org_slug = slugify(organizer)
                    artist_id, artist_outcome = self.upsert_artist(
                        f"airdosh-org-{org_slug}",
                        organizer.replace("_", " ").replace("-", " ").title(),
                        raw={"name": organizer, "source": "airdosh_organiser"},
                        city_slug=event["assigned_city_slug"],
                    )
                    tally_outcome(result, artist_outcome)
                    if artist_id is not None:
                        self.link_performer(event_id, artist_id, sort_order=0)

            status = "completed" if parsed_events else "completed_with_warnings"
            if not parsed_events:
                result.errors.append(
                    f"No AirDosh events resolved to a city ({len(unique_urls)} listings crawled)"
                )
            result.status = status
            self.finish_run(
                run_id,
                status=status,
                records_found=len(parsed_events),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
                    "expected_total": len(unique_urls),
                    "listings_crawled": len(unique_urls),
                    "city_assigned": city_assigned,
                    "city_unknown": city_unknown,
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
            )
            result.errors.append(str(exc))
        finally:
            if browser:
                browser.close()
            if pw:
                pw.stop()

        return result
