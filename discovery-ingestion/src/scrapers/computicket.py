"""Computicket scraper — event list + detail pages."""

from __future__ import annotations

import json
import re
import time
from typing import Any

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapeResult, tally_outcome

LIST_PATHS = [
    "https://www.computicket.com/event/list?eventTypes=Music",
    "https://www.computicket.com/event/list?eventTypes=Festival",
    "https://www.computicket.com/event/list?eventTypes=Comedy",
    "https://www.computicket.com/event/list?eventTypes=Sport",
    "https://www.computicket.com/event/list?eventTypes=Family",
    "https://www.computicket.com/event/list?eventTypes=Party",
    "https://www.computicket.com/event",
]

_EVENT_URL = re.compile(
    r"https?://(?:www\.)?computicket\.com/event/[^/\s\"']+/[0-9a-f-]{36}",
    re.I,
)


class ComputicketScraper(BaseScraper):
    source_provider = "computicket"

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
            found_urls: dict[str, str] = {}

            for list_url in LIST_PATHS:
                page.goto(list_url, wait_until="domcontentloaded", timeout=90000)
                page.wait_for_timeout(4000)
                for match in _EVENT_URL.findall(page.content()):
                    found_urls.setdefault(match.split("?")[0], list_url)

            events: list[dict[str, Any]] = []
            self.set_progress_total(len(found_urls) or 1)

            with self.http_client() as client:
                for idx, (url, _src) in enumerate(found_urls.items(), start=1):
                    resp = client.get(url)
                    if resp.status_code >= 400:
                        continue
                    event = self._parse_detail(resp.text, url)
                    if not event:
                        continue

                    assigned_city, reason = self.resolve_city_for_record(
                        event.get("title"),
                        event.get("location"),
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
                    events.append(event)
                    city_assigned[assigned_city] = city_assigned.get(assigned_city, 0) + 1

                    if self.on_progress:
                        self.on_progress(
                            idx,
                            len(found_urls),
                            event["title"],
                            {"phase": "detail", "outcome": "fetching", "city": assigned_city},
                        )
                    time.sleep(0.1)

            result.records = events
            result.expected_total = len(events)

            for event in events:
                external_id = event["external_id"]
                raw = dict(event)
                event_id, outcome = self.upsert_event(
                    external_id,
                    event["title"],
                    description=event.get("description"),
                    location=event.get("location"),
                    start_datetime=event.get("start_datetime"),
                    external_ticketing_url=event["url"],
                    image_url=event.get("image_url"),
                    raw=raw,
                    city_slug=event["assigned_city_slug"],
                )
                tally_outcome(result, outcome)
                if event_id is not None:
                    self.add_source_link("event", event_id, event["url"], source_external_id=external_id)
                    self.add_listing_signal("event", event_id, event["url"], listing_title=event["title"], raw=raw)

            status = "completed" if events else "completed_with_warnings"
            if not events:
                result.errors.append(
                    f"No Computicket events resolved to a city ({len(found_urls)} listings crawled)"
                )
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
                    "listings_crawled": len(found_urls),
                    "city_assigned": city_assigned,
                    "city_unknown": city_unknown,
                    "rejected_sample": rejected,
                    "expected_total": len(events),
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

    def _parse_detail(self, html: str, url: str) -> dict[str, Any] | None:
        soup = BeautifulSoup(html, "lxml")
        title = soup.title.string.split("|")[0].strip() if soup.title and soup.title.string else None
        og = soup.find("meta", property="og:title")
        if og and og.get("content"):
            title = og["content"].split("|")[0].strip()
        if not title:
            return None
        external_id = url.rstrip("/").split("/")[-1]
        event: dict[str, Any] = {
            "external_id": external_id,
            "title": title,
            "url": url,
            "description": None,
            "start_datetime": None,
            "location": None,
            "image_url": None,
        }
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            event["description"] = og_desc["content"]
        og_img = soup.find("meta", property="og:image")
        if og_img and og_img.get("content"):
            event["image_url"] = og_img["content"]
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    t = item.get("@type")
                    if t not in ("Event", "MusicEvent", "SportsEvent") and not (
                        isinstance(t, list) and any(x in t for x in ("Event", "MusicEvent"))
                    ):
                        continue
                    event["title"] = item.get("name") or event["title"]
                    event["description"] = item.get("description") or event["description"]
                    event["start_datetime"] = item.get("startDate") or event["start_datetime"]
                    loc = item.get("location")
                    if isinstance(loc, dict):
                        event["location"] = loc.get("name") or loc.get("address")
            except json.JSONDecodeError:
                continue
        return event
