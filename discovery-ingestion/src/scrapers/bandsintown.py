"""BandsInTown scraper — Playwright + JSON-LD / DOM MusicEvent parse."""

from __future__ import annotations

import json
from typing import Any

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapeResult, slugify, tally_outcome
from .playwright_helpers import scroll_until_count_stable


class BandsInTownScraper(BaseScraper):
    source_provider = "bandsintown"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id

        location = self.city.get("bandsintown_location", self.city["name"].replace(" ", "+"))
        url = (
            f"https://www.bandsintown.com/c/{location.lower().replace(' ', '-')}"
            "/all-dates/genre/all-genres"
        )

        pw = browser = context = page = None
        try:
            pw, browser, context = self.playwright_context()
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(8000)

            if "security verification" in page.inner_text("body").lower():
                self.pause_for_captcha(page)

            scroll_until_count_stable(
                page,
                """() => {
                  const seen = new Set();
                  document.querySelectorAll('a[href*="/e/"]').forEach(a => {
                    seen.add(a.href.split('?')[0]);
                  });
                  return seen.size;
                }""",
                max_rounds=40,
                pause_ms=1200,
            )

            html = page.content()
            events = self._merge_events(
                self._parse_json_ld_events(html),
                self._parse_dom_events(page),
            )

            if not events:
                result.errors.append("No BandsInTown events found (Cloudflare or empty listing)")
                result.status = "completed_with_warnings"
                self.finish_run(
                    run_id,
                    status="completed_with_warnings",
                    records_found=0,
                    records_inserted=0,
                    metadata={"inserted": 0, "updated": 0, "skipped": 0},
                )
                return result

            result.records = events
            self.set_progress_total(len(events))

            for idx, event in enumerate(events):
                external_id = str(event.get("@id") or event.get("url") or f"bit-{idx}")
                name = event.get("name") or "Untitled Show"
                start = event.get("startDate")
                location_obj = event.get("location", {})
                venue_name = (
                    location_obj.get("name")
                    if isinstance(location_obj, dict)
                    else str(location_obj) if location_obj else None
                )
                event_url = event.get("url") or url
                image = event.get("image")
                if isinstance(image, list):
                    image = image[0] if image else None

                event_id, outcome = self.upsert_event(
                    external_id,
                    name,
                    description=event.get("description"),
                    location=venue_name,
                    start_datetime=start,
                    external_ticketing_url=event_url,
                    image_url=image if isinstance(image, str) else None,
                    raw=event,
                )
                tally_outcome(result, outcome)
                if event_id is not None:
                    self.add_source_link("event", event_id, event_url, source_external_id=external_id)
                    self.add_listing_signal("event", event_id, event_url, listing_title=name, raw=event)

                    performers = event.get("performer", [])
                    if isinstance(performers, dict):
                        performers = [performers]
                    for order, performer in enumerate(performers):
                        if not isinstance(performer, dict):
                            continue
                        artist_name = performer.get("name") or "Unknown Artist"
                        artist_ext = str(
                            performer.get("@id") or performer.get("url") or slugify(artist_name)
                        )
                        artist_id, artist_outcome = self.upsert_artist(
                            artist_ext,
                            artist_name,
                            genre=performer.get("genre"),
                            image_url=performer.get("image"),
                            raw=performer,
                        )
                        tally_outcome(result, artist_outcome)
                        if artist_id is not None:
                            self.link_performer(event_id, artist_id, sort_order=order)

            result.status = "completed"
            self.finish_run(
                run_id,
                status="completed",
                records_found=len(events),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
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

    def _parse_json_ld_events(self, html: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "lxml")
        events: list[dict[str, Any]] = []
        for script in soup.find_all("script", type="application/ld+json"):
            text = script.string or script.get_text()
            if not text:
                continue
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                item_type = item.get("@type", "")
                if item_type == "MusicEvent" or (
                    isinstance(item_type, list) and "MusicEvent" in item_type
                ):
                    events.append(item)
                elif item.get("@graph"):
                    for node in item["@graph"]:
                        if isinstance(node, dict) and node.get("@type") == "MusicEvent":
                            events.append(node)
        return events

    def _parse_dom_events(self, page) -> list[dict[str, Any]]:
        cards = page.eval_on_selector_all(
            "a[href*='/e/']",
            """
            els => {
              const out = [];
              const seen = new Set();
              for (const e of els) {
                const href = (e.href || '').split('?')[0];
                if (!href || seen.has(href)) continue;
                seen.add(href);
                const card = e.closest('div');
                const text = (card?.innerText || e.innerText || '').trim();
                if (!text) continue;
                out.push({ href, text });
              }
              return out;
            }
            """,
        )
        events: list[dict[str, Any]] = []
        for card in cards:
            lines = [ln.strip() for ln in card["text"].split("\n") if ln.strip()]
            if not lines:
                continue
            performer = lines[0]
            venue = lines[1] if len(lines) > 1 else None
            when = lines[2] if len(lines) > 2 else None
            title = lines[1] if len(lines) > 2 else performer
            events.append(
                {
                    "@type": "MusicEvent",
                    "@id": card["href"],
                    "url": card["href"],
                    "name": title,
                    "startDate": when,
                    "location": {"name": venue} if venue else None,
                    "performer": [{"name": performer}],
                }
            )
        return events

    @staticmethod
    def _merge_events(
        json_ld: list[dict[str, Any]],
        dom: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        for event in json_ld + dom:
            key = str(event.get("url") or event.get("@id") or event.get("name") or "")
            if not key:
                continue
            if key not in merged:
                merged[key] = event
                continue
            existing = merged[key]
            for field in ("name", "startDate", "description", "location", "performer", "image"):
                if not existing.get(field) and event.get(field):
                    existing[field] = event[field]
        return list(merged.values())
