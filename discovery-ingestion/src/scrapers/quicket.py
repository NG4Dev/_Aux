"""Quicket scraper — Algolia products index."""

from __future__ import annotations

import time
from typing import Any

from .base import BaseScraper, ScrapeResult, tally_outcome
from .quicket_algolia import ALGOLIA_APP_ID, ALGOLIA_URL, city_filter, normalize_hit, resolve_search_api_key


class QuicketScraper(BaseScraper):
    source_provider = "quicket"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id
        hits: list[dict[str, Any]] = []

        try:
            city_name = self.city["name"]
            config_key = self.selectors.get("algolia", {}).get("search_api_key", "")
            api_key = resolve_search_api_key(config_key)
            headers = {
                "X-Algolia-Application-Id": ALGOLIA_APP_ID,
                "X-Algolia-API-Key": api_key,
            }
            filt = city_filter(city_name)
            page = 0
            nb_pages = 1

            with self.http_client() as client:
                while page < nb_pages:
                    payload = {
                        "query": "",
                        "filters": filt,
                        "hitsPerPage": 50,
                        "page": page,
                    }
                    response = client.post(ALGOLIA_URL, json=payload, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    page_hits = data.get("hits", [])
                    hits.extend(page_hits)
                    expected_total = int(data.get("nbHits", len(hits)))
                    nb_pages = int(data.get("nbPages", page + 1))
                    result.expected_total = expected_total
                    result.pages_total = nb_pages
                    result.pages_done = page + 1
                    self.set_progress_total(expected_total)

                    if self.on_progress:
                        self.on_progress(
                            min(len(hits), expected_total),
                            expected_total,
                            f"Page {page + 1}/{nb_pages}",
                            {
                                "phase": f"Page {page + 1}/{nb_pages}",
                                "outcome": "fetching",
                                "city": self.city_slug,
                            },
                        )

                    page += 1
                    if not page_hits:
                        break
                    if page < nb_pages:
                        time.sleep(0.35)

            if not hits:
                result.errors.append(f"No Quicket events returned for filter {filt!r}")

            normalized = [normalize_hit(h) for h in hits]
            result.records = normalized
            for hit in normalized:
                external_id = hit["objectID"]
                raw = hit.pop("_raw", hit)
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
                )
                tally_outcome(result, outcome)
                if event_id is not None and hit.get("url"):
                    self.add_source_link("event", event_id, hit["url"], source_external_id=external_id)
                    self.add_listing_signal("event", event_id, hit["url"], listing_title=hit["name"], raw=raw)

            result.status = "completed"
            self.finish_run(
                run_id,
                status="completed",
                records_found=len(normalized),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
                    "sample_fallback": False,
                    "expected_total": result.expected_total,
                    "pages_done": result.pages_done,
                    "pages_total": result.pages_total,
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
