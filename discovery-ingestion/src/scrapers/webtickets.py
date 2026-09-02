"""Webtickets scraper — consumer homepage + category tabs + detail pages."""

from __future__ import annotations

import re
import time
from typing import Any

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapeResult, tally_outcome
from .playwright_helpers import auto_scroll_page, click_load_more_buttons

HOME_URL = "https://www.webtickets.co.za/"
_ITEM_ID_RE = re.compile(r"event\.aspx\?itemid=(\d+)", re.I)
_FROM_DATE_RE = re.compile(
    r"From\s+(\d{1,2}\s+\w+\s+\d{4}\s+\d{2}:\d{2})",
    re.I,
)
_CATEGORY_LABELS = (
    "Featured",
    "Music",
    "Running",
    "Multisport",
    "MTB",
    "Fitness Classes",
    "Comedy",
    "Theatre",
    "Sport",
)


class WebticketsScraper(BaseScraper):
    source_provider = "webtickets"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id
        city_name = self.city["name"]

        rejected: list[dict[str, str]] = []
        city_assigned: dict[str, int] = {}
        city_unknown = 0
        parsed_count = 0

        pw = browser = context = page = None
        try:
            pw, browser, context = self.playwright_context()
            page = context.new_page()
            page.goto(HOME_URL, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(5000)
            self._try_set_location(page, city_name)

            listing = self._collect_listing_urls(page)
            for label in _CATEGORY_LABELS:
                try:
                    tab = page.get_by_text(label, exact=True).first
                    if tab.is_visible(timeout=1500):
                        tab.click(timeout=3000)
                        page.wait_for_timeout(2500)
                        listing.update(self._collect_listing_urls(page))
                except Exception:
                    continue

            unique_urls = list(dict.fromkeys(listing.values()))
            result.expected_total = len(unique_urls)
            self.set_progress_total(len(unique_urls) or 1)

            if self.on_progress:
                self.on_progress(
                    0,
                    max(len(unique_urls), 1),
                    f"Found {len(unique_urls)} Webtickets listings",
                    {"phase": "list", "outcome": "fetching", "city": self.city_slug},
                )

            parsed_events: list[dict[str, Any]] = []
            with self.http_client() as client:
                for idx, url in enumerate(unique_urls, start=1):
                    event: dict[str, Any] | None = None
                    try:
                        client.cookies.clear()
                        resp = client.get(url)
                        resp.raise_for_status()
                        html = resp.content.decode("utf-8", errors="replace")
                        event = self._parse_detail(html, url)
                    except Exception as exc:
                        result.errors.append(f"{url}: {exc}")
                        continue
                    if not event:
                        continue
                    parsed_count += 1

                    assigned_city, reason = self.resolve_city_for_record(
                        event.get("title"),
                        event.get("location"),
                        event.get("description"),
                        event.get("address"),
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
                        try:
                            self.on_progress(
                                idx,
                                len(unique_urls),
                                event["title"],
                                {
                                    "phase": "detail",
                                    "outcome": "fetching",
                                    "city": assigned_city,
                                },
                            )
                        except Exception:
                            pass
                    time.sleep(0.12)

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
                    external_ticketing_url=event["url"],
                    image_url=event.get("image_url"),
                    raw=raw,
                    city_slug=event["assigned_city_slug"],
                )
                tally_outcome(result, outcome)
                if event_id is not None:
                    self.add_source_link("event", event_id, event["url"], source_external_id=external_id)
                    self.add_listing_signal(
                        "event", event_id, event["url"], listing_title=event["title"], raw=raw
                    )

            status = "completed" if parsed_events else "completed_with_warnings"
            if not parsed_events:
                result.errors.append(
                    f"No Webtickets events resolved to a city ({len(unique_urls)} listings crawled, "
                    f"{city_unknown} unresolved)"
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
                    "listings_crawled": len(unique_urls),
                    "parsed": parsed_count,
                    "city_assigned": city_assigned,
                    "city_unknown": city_unknown,
                    "rejected_sample": rejected,
                    "expected_total": len(parsed_events),
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

    def _try_set_location(self, page, city_name: str) -> None:
        for label in ("Change Location", "My Location"):
            try:
                el = page.get_by_text(label, exact=False).first
                if el.is_visible(timeout=2000):
                    el.click(timeout=3000)
                    page.wait_for_timeout(1500)
                    break
            except Exception:
                continue
        try:
            option = page.get_by_text(city_name, exact=False).first
            if option.is_visible(timeout=2000):
                option.click(timeout=3000)
                page.wait_for_timeout(2500)
                return
        except Exception:
            pass
        for sel in ("input[type='search']", "input[placeholder*='location' i]"):
            inp = page.query_selector(sel)
            if inp and inp.is_visible():
                try:
                    inp.fill(city_name)
                    page.wait_for_timeout(800)
                    page.keyboard.press("Enter")
                    page.wait_for_timeout(2500)
                    return
                except Exception:
                    continue

    def _collect_listing_urls(self, page) -> dict[str, str]:
        auto_scroll_page(page, max_rounds=20, pause_ms=600, step_px=900)
        click_load_more_buttons(page, max_clicks=5, pause_ms=1200)
        auto_scroll_page(page, max_rounds=10, pause_ms=600, step_px=900)
        html = page.content()
        urls: dict[str, str] = {}
        for item_id in _ITEM_ID_RE.findall(html):
            href = f"{HOME_URL}v2/event.aspx?itemid={item_id}"
            urls[item_id] = href
        return urls

    def _parse_detail(self, html: str, url: str) -> dict[str, Any] | None:
        match = _ITEM_ID_RE.search(url)
        if not match:
            return None
        external_id = match.group(1)
        soup = BeautifulSoup(html, "lxml")
        title = None
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip()
        if not title and soup.title and soup.title.string:
            title = soup.title.string.strip()
        h1 = soup.find("h1")
        if h1 and h1.get_text(strip=True):
            title = h1.get_text(strip=True)
        if not title:
            return None

        description = None
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            description = og_desc["content"]
        image_url = None
        og_img = soup.find("meta", property="og:image")
        if og_img and og_img.get("content"):
            image_url = og_img["content"]

        text = soup.get_text("\n", strip=True)
        location, address = self._extract_location_and_address(soup, text)
        start_datetime = None
        date_match = _FROM_DATE_RE.search(text)
        if date_match:
            start_datetime = date_match.group(1)

        return {
            "external_id": external_id,
            "title": title,
            "url": url,
            "description": description,
            "location": location,
            "address": address,
            "start_datetime": start_datetime,
            "image_url": image_url,
        }

    @staticmethod
    def _extract_location_and_address(soup: BeautifulSoup, text: str) -> tuple[str | None, str | None]:
        from .city_filter import CITY_ALIASES

        skip = (
            "sign in",
            "my tickets",
            "help",
            "location on google",
            "change location",
            "follow us",
            "this may take",
            "buy tickets",
            "select tickets",
        )
        venue_terms = (
            "theatre",
            "theater",
            "arena",
            "stadium",
            "museum",
            "park",
            "hall",
            "club",
            "casino",
            "gardens",
            "venue",
            " ave",
            " street",
            " road",
            " boulevard",
        )
        all_city_terms = [term for aliases in CITY_ALIASES.values() for term in aliases]

        maps_link = soup.find("a", href=re.compile(r"google\.com/maps|maps\.google", re.I))
        if maps_link:
            label = maps_link.get_text(" ", strip=True)
            if label and len(label) > 5:
                return label, label

        candidates: list[str] = []
        for line in text.split("\n"):
            cleaned = line.strip()
            if len(cleaned) < 8 or len(cleaned) > 200:
                continue
            lower = cleaned.lower()
            if any(token in lower for token in skip):
                continue
            if any(term in lower for term in all_city_terms):
                return cleaned, cleaned
            if any(token in lower for token in venue_terms):
                candidates.append(cleaned)

        if candidates:
            return candidates[0], candidates[0]
        return None, None
