"""Google Places scraper — Places API (New) Text Search."""

from __future__ import annotations

import os
import time
from typing import Any

from .base import BaseScraper, ScrapeResult, tally_outcome
from .city_filter import CITY_ALIASES
from .stub_helpers import finish_scrape_run

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
SEARCH_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,places.location,"
    "places.types,places.websiteUri,places.googleMapsUri,places.nationalPhoneNumber,"
    "places.rating,places.photos,places.editorialSummary,nextPageToken"
)
BASE_QUERY_TEMPLATES = (
    "restaurants bars cafes {suffix}",
    "restaurants {suffix}",
    "bars pubs {suffix}",
    "cafes coffee shops {suffix}",
    "night clubs {suffix}",
    "food venues {suffix}",
)
# Extra templates only when GOOGLE_PLACES_EXPANDED=1
EXPANDED_QUERY_TEMPLATES = (
    "breweries {suffix}",
    "bakeries {suffix}",
    "food market {suffix}",
    "fast food {suffix}",
    "fine dining {suffix}",
)


class GooglePlacesScraper(BaseScraper):
    source_provider = "google_places"

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(source_provider=self.source_provider, city_slug=self.city_slug)
        run_id = self.start_run()
        result.run_id = run_id
        self.conn.commit()
        api_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()

        if not api_key:
            result.errors.append(
                "GOOGLE_PLACES_API_KEY not set — skipping places scrape (no fake rows inserted)"
            )
            finish_scrape_run(self, result, run_id)
            return result

        try:
            suffix = self.city.get("google_query_suffix", self.city["name"])
            queries = self._build_queries(suffix)
            seen_ids: set[str] = set()
            all_places: list[dict[str, Any]] = []
            self.set_progress_total(len(queries))
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": SEARCH_FIELD_MASK,
            }

            with self.http_client() as client:
                if not self._wait_for_api(client, headers, suffix, result):
                    result.errors.append(
                        "Google Places API still rate-limited — try again in a few minutes"
                    )
                    finish_scrape_run(self, result, run_id, status="completed_with_warnings")
                    return result

                for query_idx, query in enumerate(queries, start=1):
                    batch = self._search_query(client, headers, query, result)
                    new_places = [p for p in batch if p.get("id") and p["id"] not in seen_ids]
                    for place in new_places:
                        seen_ids.add(place["id"])
                        all_places.append(place)
                        self._upsert_place_record(place, api_key, result)
                    if new_places:
                        self.conn.commit()

                    result.records = all_places
                    result.expected_total = len(seen_ids)
                    if self.on_progress:
                        self.on_progress(
                            query_idx,
                            len(queries),
                            f"{len(seen_ids)} places ({query[:50]})",
                            {
                                "phase": f"Query {query_idx}/{len(queries)}",
                                "outcome": "fetching",
                                "city": self.city_slug,
                            },
                        )
                    time.sleep(8.0)

            if not seen_ids:
                result.errors.append("Google Places search returned no results")
                finish_scrape_run(self, result, run_id, status="completed_with_warnings")
                return result

            result.status = "completed"
            self.finish_run(
                run_id,
                status="completed",
                records_found=len(seen_ids),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
                    "queries_run": len(queries),
                    "expected_total": len(seen_ids),
                },
            )
        except Exception as exc:
            if result.inserted or result.updated or result.records:
                self.conn.commit()
                result.status = "completed_with_warnings"
                result.errors.append(str(exc))
                self.finish_run(
                    run_id,
                    status="completed_with_warnings",
                    records_found=len(result.records),
                    records_inserted=result.inserted + result.updated,
                    error_message=str(exc),
                    metadata={
                        "inserted": result.inserted,
                        "updated": result.updated,
                        "skipped": result.skipped,
                        "partial": True,
                    },
                )
            else:
                finish_scrape_run(self, result, run_id, error=str(exc))

        return result

    def _upsert_place_record(
        self,
        place: dict[str, Any],
        api_key: str,
        result: ScrapeResult,
    ) -> None:
        place_id = place["id"]
        name = self._display_name(place)
        loc = place.get("location") or {}
        photos = self._photo_urls(place.get("photos") or [], api_key)
        description = self._editorial_summary(place)
        db_id, outcome = self.upsert_place(
            place_id,
            name,
            description=description,
            place_kind=self._map_place_kind(place.get("types", [])),
            address=place.get("formattedAddress"),
            lat=loc.get("latitude"),
            lng=loc.get("longitude"),
            website=place.get("websiteUri"),
            google_maps_url=place.get("googleMapsUri"),
            phone=place.get("nationalPhoneNumber"),
            google_raw_json=place,
            photo_urls=photos,
            raw=place,
        )
        tally_outcome(result, outcome)
        if db_id is not None:
            maps_url = place.get("googleMapsUri") or (
                f"https://www.google.com/maps/place/?q=place_id:{place_id}"
            )
            self.add_source_link("place", db_id, maps_url, source_external_id=place_id)
            if place.get("websiteUri"):
                self.add_listing_signal(
                    "place", db_id, place["websiteUri"], listing_title=name
                )

    def _build_queries(self, suffix: str) -> list[str]:
        templates = list(BASE_QUERY_TEMPLATES)
        if os.getenv("GOOGLE_PLACES_EXPANDED", "").strip().lower() in {"1", "true", "yes"}:
            templates.extend(EXPANDED_QUERY_TEMPLATES)
            suburb_stems = ("restaurants", "bars", "cafes")
        else:
            # High-yield suburb passes only (matches ~410 probe set)
            suburb_stems = ("restaurants",)

        queries = [template.format(suffix=suffix) for template in templates]
        seen = set(queries)
        for alias in CITY_ALIASES.get(self.city_slug, []):
            if len(alias) < 4 or alias in {"jhb", "cpt", "pta", "kzn", "gauteng"}:
                continue
            if alias not in {"sandton", "rosebank", "soweto"} and suburb_stems == ("restaurants",):
                continue
            for stem in suburb_stems:
                query = f"{stem} {alias} {suffix}"
                if query not in seen:
                    seen.add(query)
                    queries.append(query)
        return queries

    def _wait_for_api(
        self,
        client,
        headers: dict[str, str],
        suffix: str,
        result: ScrapeResult,
        *,
        max_wait_sec: int = 300,
    ) -> bool:
        """Block until API accepts a probe request or timeout."""
        probe = {"textQuery": f"restaurants {suffix}", "pageSize": 1}
        waited = 0
        delay = 15
        while waited <= max_wait_sec:
            resp = client.post(SEARCH_URL, headers=headers, json=probe)
            if resp.status_code == 200:
                return True
            if resp.status_code != 429:
                result.errors.append(f"Google Places probe failed: HTTP {resp.status_code}")
                return False
            result.errors.append(f"API rate-limited; waiting {delay}s before retry")
            time.sleep(delay)
            waited += delay
            delay = min(delay * 2, 60)
        return False

    def _search_query(
        self,
        client,
        headers: dict[str, str],
        query: str,
        result: ScrapeResult,
    ) -> list[dict[str, Any]]:
        by_id: dict[str, dict[str, Any]] = {}
        page_token: str | None = None

        while True:
            body: dict[str, Any] = {"textQuery": query, "pageSize": 20}
            if page_token:
                body["pageToken"] = page_token
            search_data = self._post_search(client, headers, body, query, result)
            if search_data is None:
                break

            for place in search_data.get("places", []):
                place_id = place.get("id")
                if place_id:
                    by_id.setdefault(place_id, place)

            page_token = search_data.get("nextPageToken")
            if not page_token:
                break
            time.sleep(3.0)

        return list(by_id.values())

    def _post_search(
        self,
        client,
        headers: dict[str, str],
        body: dict[str, Any],
        query: str,
        result: ScrapeResult,
    ) -> dict[str, Any] | None:
        for attempt in range(8):
            search_resp = client.post(SEARCH_URL, headers=headers, json=body)
            if search_resp.status_code == 429:
                wait = min(90, 5 * (2**attempt))
                result.errors.append(
                    f"Google Places rate limited ({query[:40]}); waiting {wait}s"
                )
                time.sleep(wait)
                continue
            if search_resp.status_code >= 400:
                result.errors.append(
                    f"Google Places HTTP {search_resp.status_code} ({query[:40]})"
                )
                return None
            search_data = search_resp.json()
            if search_data.get("error"):
                err = search_data["error"]
                message = err.get("message", str(err))
                result.errors.append(f"Google Places API error ({query[:40]}): {message}")
                return None
            return search_data
        result.errors.append(f"Google Places rate limit exceeded ({query[:40]})")
        return None

    @staticmethod
    def _display_name(place: dict[str, Any]) -> str:
        display = place.get("displayName") or {}
        if isinstance(display, dict):
            return display.get("text") or "Unknown Place"
        return str(display)

    @staticmethod
    def _editorial_summary(place: dict[str, Any]) -> str | None:
        summary = place.get("editorialSummary")
        if isinstance(summary, dict):
            return summary.get("text")
        return None

    @staticmethod
    def _photo_urls(photos: list[dict[str, Any]], api_key: str) -> list[str]:
        urls: list[str] = []
        for photo in photos[:5]:
            name = photo.get("name")
            if not name:
                continue
            urls.append(
                f"https://places.googleapis.com/v1/{name}/media"
                f"?maxWidthPx=800&key={api_key}"
            )
        return urls

    @staticmethod
    def _map_place_kind(types: list[str]) -> str:
        if any(t in types for t in ("restaurant", "bar", "cafe", "night_club")):
            return "venue"
        return "other"
