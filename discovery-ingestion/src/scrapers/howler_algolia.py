"""Howler Algolia API helpers."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

import httpx

from .city_filter import infer_city_slug

ALGOLIA_INDEX = "Event"
HOWLER_ACTIVE_URL = "https://www.howler.co.za/active"
HOWLER_BASE = "https://www.howler.co.za"
APP_CONFIG_MARKER = "window.APP_CONFIG = "


def _extract_app_config(html: str) -> dict[str, Any]:
    start = html.find(APP_CONFIG_MARKER)
    if start < 0:
        raise RuntimeError("Could not find Howler APP_CONFIG on /active page")
    i = start + len(APP_CONFIG_MARKER)
    if i >= len(html) or html[i] != "{":
        raise RuntimeError("Malformed Howler APP_CONFIG block")
    depth = 0
    for j in range(i, len(html)):
        ch = html[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(html[i : j + 1])
    raise RuntimeError("Unterminated Howler APP_CONFIG JSON")


@lru_cache(maxsize=1)
def _fetch_algolia_from_active_page() -> tuple[str, str]:
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        resp = client.get(HOWLER_ACTIVE_URL)
        resp.raise_for_status()
        cfg = _extract_app_config(resp.text)
        algolia = cfg.get("algolia") or {}
        app_id = algolia.get("applicationId")
        api_key = algolia.get("apiKey")
        if not app_id or not api_key:
            raise RuntimeError("Howler APP_CONFIG missing algolia credentials")
        return str(app_id), str(api_key)


def resolve_algolia_config(config: dict[str, Any] | None = None) -> tuple[str, str]:
    if config:
        app_id = config.get("applicationId") or config.get("app_id")
        api_key = config.get("apiKey") or config.get("api_key")
        if app_id and api_key:
            return str(app_id), str(api_key)

    env_app = os.getenv("HOWLER_ALGOLIA_APP_ID", "").strip()
    env_key = os.getenv("HOWLER_ALGOLIA_API_KEY", "").strip()
    if env_app and env_key:
        return env_app, env_key

    return _fetch_algolia_from_active_page()


def algolia_url(app_id: str) -> str:
    return f"https://{app_id.lower()}-dsn.algolia.net/1/indexes/{ALGOLIA_INDEX}/query"


def event_city_slug(hit: dict[str, Any]) -> str | None:
    venue = hit.get("venue") or {}
    addr = str(venue.get("address") or "")
    name = str(hit.get("name") or "")
    venue_name = str(venue.get("name") or "")
    tags = hit.get("tags") or []
    tag_text = " ".join(str(t) for t in tags) if isinstance(tags, list) else str(tags)
    og_url = str(hit.get("og_url") or "")
    city_slug, _confidence, _reason = infer_city_slug(name, venue_name, addr, tag_text, og_url)
    return city_slug


def normalize_hit(hit: dict[str, Any]) -> dict[str, Any]:
    slug = str(hit.get("slug") or hit.get("objectID") or "")
    object_id = str(hit.get("objectID") or slug)
    header = hit.get("header_image")
    image_url = None
    if isinstance(header, str) and header:
        image_url = header if header.startswith("http") else f"{HOWLER_BASE}{header}"
    og_url = hit.get("og_url")
    if og_url and isinstance(og_url, str) and og_url.startswith("http"):
        event_url = og_url
    elif slug:
        event_url = f"{HOWLER_BASE}/events/{slug}"
    else:
        event_url = HOWLER_BASE
    venue = hit.get("venue") or {}
    organiser = hit.get("organiser") or {}
    assigned_city = event_city_slug(hit)
    return {
        "objectID": object_id,
        "slug": slug,
        "name": hit.get("name") or "Untitled Event",
        "description": hit.get("primary_category_name"),
        "startDate": hit.get("start_time"),
        "endDate": hit.get("end_time"),
        "venue": venue.get("name"),
        "address": venue.get("address"),
        "url": event_url,
        "image": image_url,
        "organizer": organiser.get("name"),
        "categories": hit.get("tags") or [],
        "assigned_city_slug": assigned_city,
        "_raw": hit,
    }


def fetch_howler_events(
    *,
    app_id: str,
    api_key: str,
    client: httpx.Client | None = None,
    city_query: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Fetch Howler events from Algolia; assign city from venue/address text."""
    url = algolia_url(app_id)
    headers = {
        "X-Algolia-Application-Id": app_id,
        "X-Algolia-API-Key": api_key,
    }
    raw_by_id: dict[str, dict[str, Any]] = {}

    own_client = client is None
    http = client or httpx.Client(timeout=30)

    def _collect(query: str) -> None:
        page = 0
        nb_pages = 1
        while page < nb_pages:
            resp = http.post(
                url,
                json={"query": query, "hitsPerPage": 100, "page": page},
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            for hit in data.get("hits", []):
                oid = str(hit.get("objectID") or "")
                if oid:
                    raw_by_id[oid] = hit
            nb_pages = int(data.get("nbPages", page + 1))
            page += 1

    try:
        _collect("")
        if city_query:
            _collect(city_query)
    finally:
        if own_client:
            http.close()

    raw_hits = list(raw_by_id.values())
    normalized = [normalize_hit(h) for h in raw_hits if event_city_slug(h)]
    return normalized, len(raw_hits)


def fetch_city_events(
    city_name: str,
    *,
    app_id: str,
    api_key: str,
    client: httpx.Client | None = None,
    target_city_slug: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Backward-compatible wrapper."""
    events, raw_total = fetch_howler_events(
        app_id=app_id,
        api_key=api_key,
        client=client,
        city_query=city_name,
    )
    if target_city_slug:
        events = [e for e in events if e.get("assigned_city_slug") == target_city_slug]
    return events, raw_total
