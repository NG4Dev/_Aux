"""Quicket Algolia API helpers."""

from __future__ import annotations

import os
import re
from functools import lru_cache

import httpx

ALGOLIA_APP_ID = "QAUIPDMSEL"
ALGOLIA_INDEX = "products"
ALGOLIA_URL = f"https://{ALGOLIA_APP_ID.lower()}-dsn.algolia.net/1/indexes/{ALGOLIA_INDEX}/query"
MAIN_JS_PATTERN = re.compile(r"/app-elements/main\.[a-f0-9]+\.js")
API_KEY_PATTERN = re.compile(
    r'(?:apiKey|algoliaKey|searchApiKey)["\']?\s*[:=]\s*["\']([a-f0-9]{32})["\']',
    re.I,
)


@lru_cache(maxsize=1)
def resolve_search_api_key(config_key: str = "") -> str:
    """Resolve Algolia search-only key: config -> env -> Quicket frontend bundle."""
    if config_key:
        return config_key
    env_key = os.getenv("QUICKET_ALGOLIA_SEARCH_KEY", "").strip()
    if env_key:
        return env_key
    return _fetch_key_from_quicket_bundle()


def _fetch_key_from_quicket_bundle() -> str:
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        home = client.get("https://www.quicket.co.za/events")
        home.raise_for_status()
        js_match = MAIN_JS_PATTERN.search(home.text)
        if not js_match:
            raise RuntimeError("Could not find Quicket main.js bundle for Algolia key")
        js_url = f"https://www.quicket.co.za{js_match.group(0)}"
        js_text = client.get(js_url).text
        keys = API_KEY_PATTERN.findall(js_text)
        if not keys:
            raise RuntimeError("No Algolia apiKey found in Quicket bundle")
        # Prefer the key that returns 200 on a probe query
        for key in dict.fromkeys(keys):
            probe = client.post(
                ALGOLIA_URL,
                json={"query": "", "hitsPerPage": 1, "page": 0},
                headers={
                    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
                    "X-Algolia-API-Key": key,
                },
            )
            if probe.status_code == 200:
                return key
        raise RuntimeError("No working Algolia search key found in Quicket bundle")


def city_filter(city_name: str) -> str:
    """Algolia facet filter — field is capitalized ``City`` on the products index."""
    escaped = city_name.replace("'", "\\'")
    return f"City:'{escaped}'"


def normalize_hit(hit: dict) -> dict:
    """Map Quicket Algolia product fields to scraper-normalized shape."""
    object_id = str(hit.get("objectID") or hit.get("ProductId") or hit.get("slug") or "")
    slug = hit.get("slug") or object_id
    product_url = hit.get("ProductUrl") or hit.get("url")
    if not product_url and slug:
        product_url = f"https://www.quicket.co.za/events/{slug}"
    return {
        "objectID": object_id,
        "name": hit.get("ProductName") or hit.get("name") or hit.get("title") or "Untitled Event",
        "description": hit.get("ProductDescription") or hit.get("description"),
        "startDate": hit.get("DateFrom") or hit.get("startDate") or hit.get("start_date"),
        "endDate": hit.get("DateTo") or hit.get("endDate"),
        "venue": hit.get("VenueName") or hit.get("venue") or hit.get("venueName"),
        "city": hit.get("City") or hit.get("city"),
        "region": hit.get("Region") or hit.get("region"),
        "url": product_url,
        "image": hit.get("ImageUrl") or hit.get("ImageUrl_Medium") or hit.get("image"),
        "organizer": hit.get("Organiser") or hit.get("organizer"),
        "categories": hit.get("Categories") or hit.get("categories"),
        "_raw": hit,
    }
