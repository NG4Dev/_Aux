"""Fomosa experience deals scraper."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapeResult, tally_outcome

LIST_URL = "https://www.fomosa.co.za/experiences"


class FomosaScraper(BaseScraper):
    source_provider = "fomosa"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id

        rejected: list[dict[str, str]] = []
        city_assigned: dict[str, int] = {}
        city_unknown = 0
        deals: list[dict[str, Any]] = []

        try:
            with self.http_client() as client:
                resp = client.get(LIST_URL)
                if resp.status_code not in (200, 404) or len(resp.text) < 5000:
                    resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "lxml")

            seen: set[str] = set()
            listings: list[dict[str, Any]] = []
            for anchor in soup.find_all("a", href=True):
                href = anchor["href"]
                if "/product/" not in href:
                    continue
                url = href if href.startswith("http") else urljoin("https://www.fomosa.co.za", href)
                if url in seen:
                    continue
                seen.add(url)
                title = anchor.get_text(" ", strip=True)
                if not title or len(title) < 8:
                    slug = url.rstrip("/").split("/")[-1]
                    title = slug.replace("-", " ").title()
                external_id = url.rstrip("/").split("/")[-1]
                listings.append(
                    {
                        "external_id": external_id,
                        "title": title[:500],
                        "url": url,
                    }
                )

            result.expected_total = len(listings)
            self.set_progress_total(len(listings) or 1)

            for deal in listings:
                assigned_city, reason = self.resolve_city_for_record(deal["title"])
                if assigned_city is None:
                    city_unknown += 1
                    if len(rejected) < 25:
                        rejected.append(
                            {"title": deal["title"][:120], "url": deal["url"], "reason": reason}
                        )
                    continue
                deal["assigned_city_slug"] = assigned_city
                deal["city_assignment_reason"] = reason
                deals.append(deal)
                city_assigned[assigned_city] = city_assigned.get(assigned_city, 0) + 1

            result.records = deals

            for deal in deals:
                deal_id, outcome = self.upsert_deal(
                    deal["external_id"],
                    deal["title"],
                    deal_url=deal["url"],
                    raw=deal,
                    city_slug=deal["assigned_city_slug"],
                )
                tally_outcome(result, outcome)
                if deal_id is not None:
                    self.add_source_link("deal", deal_id, deal["url"], source_external_id=deal["external_id"])

            status = "completed" if deals else "completed_with_warnings"
            if not deals:
                result.errors.append(
                    f"No Fomosa deals resolved to a city ({len(listings)} listings crawled)"
                )
            result.status = status
            self.finish_run(
                run_id,
                status=status,
                records_found=len(deals),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
                    "listings_crawled": len(listings),
                    "city_assigned": city_assigned,
                    "city_unknown": city_unknown,
                    "rejected_sample": rejected,
                    "expected_total": len(deals),
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

        return result
