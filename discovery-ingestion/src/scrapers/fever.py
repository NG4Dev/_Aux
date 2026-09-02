"""Fever scraper — city category pages on feverup.com."""

from __future__ import annotations

import json
import re
import time
from typing import Any

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapeResult, tally_outcome
from .playwright_helpers import scroll_until_count_stable


class FeverScraper(BaseScraper):
    source_provider = "fever"
    CATEGORY_SUFFIX = "music-events"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id

        city_path = self.city_slug.replace("_", "-")
        list_url = f"https://feverup.com/en/{city_path}/{self.CATEGORY_SUFFIX}"

        pw = browser = context = page = None
        try:
            pw, browser, context = self.playwright_context()
            page = context.new_page()
            page.goto(list_url, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(6000)

            scroll_until_count_stable(
                page,
                "document.querySelectorAll(\"a[href*='/m/']\").length",
                max_rounds=20,
                pause_ms=800,
            )

            plan_links = page.eval_on_selector_all(
                "a[href*='/m/']",
                """
                els => {
                  const byId = {};
                  for (const e of els) {
                    const href = (e.href || '').split('?')[0];
                    const match = href.match(/\\/m\\/(\\d+)/);
                    if (!match) continue;
                    const text = (e.innerText || '').trim();
                    const planId = match[1];
                    if (!byId[planId] || text.length > (byId[planId].text || '').length) {
                      byId[planId] = { href, text, planId };
                    }
                  }
                  return Object.values(byId);
                }
                """,
            )

            events: list[dict[str, Any]] = []
            self.set_progress_total(len(plan_links) or 1)

            with self.http_client() as client:
                for idx, item in enumerate(plan_links, start=1):
                    url = item["href"]
                    title = self._title_from_card(item["text"]) or item["text"].split("\n")[0].strip()
                    external_id = f"m-{item['planId']}"
                    detail = self._fetch_plan_detail(client, url, title, external_id)
                    events.append(detail)
                    if self.on_progress:
                        self.on_progress(
                            idx,
                            len(plan_links),
                            title,
                            {"phase": "plan", "outcome": "fetching", "city": self.city_slug},
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
                )
                tally_outcome(result, outcome)
                if event_id is not None:
                    self.add_source_link("event", event_id, event["url"], source_external_id=external_id)
                    self.add_listing_signal("event", event_id, event["url"], listing_title=event["title"], raw=raw)

            status = "completed" if events else "completed_with_warnings"
            if not events:
                result.errors.append(f"No Fever plans found at {list_url}")
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
                    "expected_total": len(events),
                    "list_url": list_url,
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

    @staticmethod
    def _title_from_card(text: str) -> str | None:
        lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
        if len(lines) >= 2:
            return lines[1]
        return lines[0] if lines else None

    def _fetch_plan_detail(
        self,
        client,
        url: str,
        fallback_title: str,
        external_id: str,
    ) -> dict[str, Any]:
        event = {
            "external_id": external_id,
            "title": fallback_title,
            "url": url,
            "description": None,
            "start_datetime": None,
            "location": None,
            "image_url": None,
        }
        try:
            resp = client.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            if soup.title and soup.title.string:
                event["title"] = soup.title.string.split("|")[0].strip()
            og = soup.find("meta", property="og:description")
            if og and og.get("content"):
                event["description"] = og["content"]
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
                        if t not in ("Event", "MusicEvent") and not (
                            isinstance(t, list) and "Event" in t
                        ):
                            continue
                        event["title"] = item.get("name") or event["title"]
                        event["description"] = item.get("description") or event["description"]
                        event["start_datetime"] = item.get("startDate") or event["start_datetime"]
                        loc = item.get("location")
                        if isinstance(loc, dict):
                            event["location"] = loc.get("name") or loc.get("address")
                        elif isinstance(loc, str):
                            event["location"] = loc
                except json.JSONDecodeError:
                    continue
        except Exception:
            pass
        return event
