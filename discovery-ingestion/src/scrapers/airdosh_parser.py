"""Parse AirDosh ticket event pages (tickets.airdosh.co.za)."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

TICKETS_BASE = "https://tickets.airdosh.co.za"
LIST_URL = f"{TICKETS_BASE}/"

_START_SECONDS = re.compile(r'"startTime":\{"seconds":(\d+)')
_END_SECONDS = re.compile(r'"endTime":\{"seconds":(\d+)')


def _unescape_json_string(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except json.JSONDecodeError:
        return (
            value.replace("\\u0026", "&")
            .replace('\\"', '"')
            .replace("\\\\", "\\")
            .replace("\\n", "\n")
        )


def _extract_escaped_field(html: str, field: str) -> str | None:
    marker = f'{field}\\":\\"'
    start = html.find(marker)
    if start < 0:
        return None
    start += len(marker)
    end = html.find('\\",', start)
    if end < 0:
        end = html.find('",', start)
    if end < 0:
        return None
    return _unescape_json_string(html[start:end])


def _ts_to_iso(seconds: str | None) -> str | None:
    if not seconds:
        return None
    return datetime.fromtimestamp(int(seconds), tz=timezone.utc).isoformat()


def external_id_from_url(url: str) -> str:
    parts = url.rstrip("/").split("/")
    if len(parts) >= 2:
        return f"{parts[-2]}/{parts[-1]}"
    return parts[-1] if parts else url


def parse_event_html(html: str, url: str) -> dict[str, Any] | None:
    title = _extract_escaped_field(html, "event_title")
    if not title:
        return None
    venue = _extract_escaped_field(html, "venueName")
    address = _extract_escaped_field(html, "address")
    location = ", ".join(x for x in (venue, address) if x)
    start_m = _START_SECONDS.search(html)
    end_m = _END_SECONDS.search(html)

    return {
        "external_id": external_id_from_url(url),
        "title": title,
        "description": _extract_escaped_field(html, "event_description"),
        "start_datetime": _ts_to_iso(start_m.group(1) if start_m else None),
        "end_datetime": _ts_to_iso(end_m.group(1) if end_m else None),
        "location": location or venue,
        "venue": venue,
        "address": address,
        "url": url,
        "image_url": _extract_escaped_field(html, "titleImage"),
        "organizer": _extract_escaped_field(html, "orgId"),
    }


def fetch_listing_urls(page) -> list[dict[str, str]]:
    """Playwright page must be on tickets.airdosh.co.za home."""
    return page.eval_on_selector_all(
        "a[href*='/event/']",
        """
        els => {
          const out = [];
          const seen = new Set();
          for (const e of els) {
            const href = (e.href || '').split('?')[0];
            if (!href.includes('/event/') || seen.has(href)) continue;
            seen.add(href);
            out.push({ href, text: (e.innerText || '').trim() });
          }
          return out;
        }
        """,
    )
