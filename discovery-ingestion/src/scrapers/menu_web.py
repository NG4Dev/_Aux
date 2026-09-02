"""Menu web scraper — extracts menu items from place websites."""

from __future__ import annotations

import json

from .base import BaseScraper, ScrapeResult
from .stub_helpers import finish_scrape_run


class MenuWebScraper(BaseScraper):
    source_provider = "menu_web"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id

        try:
            places = self.conn.execute(
                """
                SELECT id, name, website, menu_listing_url
                FROM places
                WHERE city_slug = ? AND website IS NOT NULL
                LIMIT 10
                """,
                (self.city_slug,),
            ).fetchall()

            if not places:
                result.errors.append(
                    "No places with websites in this city — run google_places first"
                )
                finish_scrape_run(self, result, run_id)
                return result

            self.set_progress_total(len(places))

            for place in places:
                menu_url = place["menu_listing_url"] or place["website"]
                self.emit_progress(place["name"], "fetching", phase="menu")
                # Real menu extraction (Playwright) not wired — skip until place sites crawled
                result.errors.append(
                    f"Menu crawl not wired for {place['name']} ({menu_url}) — skipped"
                )
                self.emit_progress(place["name"], "skipped", phase="menu", skip_reason="not wired")

            finish_scrape_run(self, result, run_id)
        except Exception as exc:
            finish_scrape_run(self, result, run_id, error=str(exc))

        return result
