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

        incremental = self._incremental_enabled()
        max_new = self._max_new_cap(incremental)
        api_requests_made = 0
        skipped_known = 0
        new_fetched = 0
        stopped_reason: str | None = None

        try:
            if incremental and not self.force:
                skip_fresh, existing_count = self._should_skip_fresh_run(run_id)
                if skip_fresh:
                    result.status = "skipped_fresh"
                    result.expected_total = existing_count
                    self.finish_run(
                        run_id,
                        status="skipped_fresh",
                        records_found=existing_count,
                        records_inserted=0,
                        metadata={
                            "skipped_fresh": True,
                            "existing_places": existing_count,
                            "api_requests_made": 0,
                            "incremental": True,
                        },
                    )
                    return result

            suffix = self.city.get("google_query_suffix", self.city["name"])
            queries = self._build_queries(suffix)
            known_ids = self._preload_known_place_ids()
            seen_ids: set[str] = set(known_ids)
            all_places: list[dict[str, Any]] = []
            self.set_progress_total(len(queries))
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": SEARCH_FIELD_MASK,
            }

            with self.http_client() as client:
                if not self._wait_for_api(
                    client, headers, suffix, result, incremental=incremental
                ):
                    api_requests_made += 1
                    if incremental and any("rate-limited" in e.lower() for e in result.errors):
                        stopped_reason = "rate_limited"
                    else:
                        result.errors.append(
                            "Google Places API still rate-limited — try again in a few minutes"
                        )
                    self._finish_partial(
                        run_id,
                        result,
                        seen_ids,
                        api_requests_made,
                        skipped_known,
                        new_fetched,
                        stopped_reason,
                        len(queries),
                    )
                    return result
                api_requests_made += 1

                for query_idx, query in enumerate(queries, start=1):
                    if incremental and new_fetched >= max_new:
                        break

                    batch, rate_limited, requests = self._search_query(
                        client,
                        headers,
                        query,
                        result,
                        incremental=incremental,
                    )
                    api_requests_made += requests
                    if rate_limited:
                        stopped_reason = "rate_limited"
                        break

                    for place in batch:
                        place_id = place.get("id")
                        if not place_id:
                            continue
                        if place_id in seen_ids:
                            if place_id in known_ids:
                                skipped_known += 1
                            continue

                        skip, _ = self.should_skip("places", place_id, place)
                        if incremental and new_fetched >= max_new and not skip:
                            break

                        seen_ids.add(place_id)
                        all_places.append(place)
                        inserted_before = result.inserted
                        updated_before = result.updated
                        self._upsert_place_record(place, api_key, result)
                        self.conn.commit()

                        if not skip and (
                            result.inserted > inserted_before or result.updated > updated_before
                        ):
                            new_fetched += 1
                        elif skip:
                            skipped_known += 1

                        if incremental and new_fetched >= max_new:
                            break

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
                    if stopped_reason or (incremental and new_fetched >= max_new):
                        break
                    time.sleep(8.0)

            if not seen_ids and not known_ids:
                result.errors.append("Google Places search returned no results")
                finish_scrape_run(self, result, run_id, status="completed_with_warnings")
                return result

            final_status = "completed_with_warnings" if stopped_reason or result.errors else "completed"
            result.status = final_status
            self.finish_run(
                run_id,
                status=final_status,
                records_found=len(seen_ids),
                records_inserted=result.inserted + result.updated,
                metadata={
                    "inserted": result.inserted,
                    "updated": result.updated,
                    "skipped": result.skipped,
                    "skipped_known": skipped_known,
                    "new_fetched": new_fetched,
                    "queries_run": query_idx if "query_idx" in locals() else 0,
                    "expected_total": len(seen_ids),
                    "api_requests_made": api_requests_made,
                    "incremental": incremental,
                    "stopped_reason": stopped_reason,
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
                        "skipped_known": skipped_known,
                        "api_requests_made": api_requests_made,
                        "partial": True,
                        "stopped_reason": stopped_reason,
                    },
                )
            else:
                finish_scrape_run(self, result, run_id, error=str(exc))

        return result

    def _incremental_enabled(self) -> bool:
        env_ok = os.getenv("GOOGLE_PLACES_INCREMENTAL", "1").strip().lower() in {
            "1",
            "true",
            "yes",
        }
        return bool(self.incremental and env_ok)

    @staticmethod
    def _max_new_cap(incremental: bool) -> int:
        default = "50" if incremental else "99999"
        try:
            return int(os.getenv("GOOGLE_PLACES_MAX_NEW", default))
        except ValueError:
            return 50 if incremental else 99999

    def _preload_known_place_ids(self) -> set[str]:
        rows = self.conn.execute(
            """
            SELECT source_external_id FROM places
            WHERE source_provider = ? AND city_slug = ?
            """,
            (self.source_provider, self.city_slug),
        ).fetchall()
        return {row["source_external_id"] for row in rows if row["source_external_id"]}

    def _should_skip_fresh_run(self, run_id: int) -> tuple[bool, int]:
        row = self.conn.execute(
            """
            SELECT finished_at, status FROM scrape_runs
            WHERE source_provider = ? AND city_slug = ?
              AND status IN ('completed', 'completed_with_warnings', 'skipped_fresh')
              AND id != ?
            ORDER BY id DESC LIMIT 1
            """,
            (self.source_provider, self.city_slug, run_id),
        ).fetchone()
        if not row or not row["finished_at"]:
            return False, 0
        if not self._within_ttl(row["finished_at"]):
            return False, 0
        count_row = self.conn.execute(
            """
            SELECT COUNT(*) AS c FROM places
            WHERE source_provider = ? AND city_slug = ?
            """,
            (self.source_provider, self.city_slug),
        ).fetchone()
        existing = int(count_row["c"]) if count_row else 0
        return True, existing

    def _finish_partial(
        self,
        run_id: int,
        result: ScrapeResult,
        seen_ids: set[str],
        api_requests_made: int,
        skipped_known: int,
        new_fetched: int,
        stopped_reason: str | None,
        queries_total: int,
    ) -> None:
        result.status = "completed_with_warnings"
        self.finish_run(
            run_id,
            status="completed_with_warnings",
            records_found=len(seen_ids),
            records_inserted=result.inserted + result.updated,
            metadata={
                "inserted": result.inserted,
                "updated": result.updated,
                "skipped": result.skipped,
                "skipped_known": skipped_known,
                "new_fetched": new_fetched,
                "api_requests_made": api_requests_made,
                "stopped_reason": stopped_reason,
                "queries_total": queries_total,
                "incremental": self._incremental_enabled(),
            },
        )

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
        incremental: bool = False,
        max_wait_sec: int = 300,
    ) -> bool:
        probe = {"textQuery": f"restaurants {suffix}", "pageSize": 1}
        if incremental:
            resp = client.post(SEARCH_URL, headers=headers, json=probe)
            if resp.status_code == 200:
                return True
            if resp.status_code == 429:
                result.errors.append("Google Places probe rate-limited (HTTP 429) — stop and retry later")
                return False
            result.errors.append(f"Google Places probe failed: HTTP {resp.status_code}")
            return False

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
        *,
        incremental: bool = False,
    ) -> tuple[list[dict[str, Any]], bool, int]:
        by_id: dict[str, dict[str, Any]] = {}
        page_token: str | None = None
        rate_limited = False
        requests = 0

        while True:
            body: dict[str, Any] = {"textQuery": query, "pageSize": 20}
            if page_token:
                body["pageToken"] = page_token
            search_data, status, requests_delta = self._post_search(
                client, headers, body, query, result, incremental=incremental
            )
            requests += requests_delta
            if status == 429:
                rate_limited = True
                break
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

        return list(by_id.values()), rate_limited, requests

    def _post_search(
        self,
        client,
        headers: dict[str, str],
        body: dict[str, Any],
        query: str,
        result: ScrapeResult,
        *,
        incremental: bool = False,
    ) -> tuple[dict[str, Any] | None, int, int]:
        if incremental:
            search_resp = client.post(SEARCH_URL, headers=headers, json=body)
            if search_resp.status_code == 429:
                result.errors.append(
                    f"Google Places rate limited ({query[:40]}); stopping incremental run"
                )
                return None, 429, 1
            if search_resp.status_code >= 400:
                result.errors.append(
                    f"Google Places HTTP {search_resp.status_code} ({query[:40]})"
                )
                return None, search_resp.status_code, 1
            search_data = search_resp.json()
            if search_data.get("error"):
                err = search_data["error"]
                message = err.get("message", str(err))
                result.errors.append(f"Google Places API error ({query[:40]}): {message}")
                return None, 400, 1
            return search_data, 200, 1

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
                return None, search_resp.status_code, 1
            search_data = search_resp.json()
            if search_data.get("error"):
                err = search_data["error"]
                message = err.get("message", str(err))
                result.errors.append(f"Google Places API error ({query[:40]}): {message}")
                return None, 400, 1
            return search_data, 200, 1
        result.errors.append(f"Google Places rate limit exceeded ({query[:40]})")
        return None, 429, 8

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
