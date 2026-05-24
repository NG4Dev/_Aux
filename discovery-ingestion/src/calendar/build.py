"""Calendar builder — aggregates events into month/week views."""

from __future__ import annotations

import json
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(value.replace("+02:00", "+0200"), fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def build_calendar(
    conn: sqlite3.Connection,
    *,
    city_slug: str | None = None,
    months: int = 3,
) -> dict[str, Any]:
    cities: list[str]
    if city_slug and city_slug != "all":
        cities = [city_slug]
    else:
        rows = conn.execute("SELECT DISTINCT city_slug FROM events").fetchall()
        cities = [r["city_slug"] for r in rows] or ["johannesburg"]

    now = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    summary: dict[str, Any] = {"cities": {}, "months_built": months}

    for city in cities:
        events = conn.execute(
            """
            SELECT id, name, start_datetime, raw_json
            FROM events
            WHERE city_slug = ? AND start_datetime IS NOT NULL
            """,
            (city,),
        ).fetchall()

        month_buckets: dict[str, list[int]] = defaultdict(list)
        week_buckets: dict[str, list[int]] = defaultdict(list)
        genre_counter: Counter[str] = Counter()

        for event in events:
            dt = _parse_dt(event["start_datetime"])
            if not dt:
                continue
            if dt.tzinfo is not None:
                dt = dt.replace(tzinfo=None)
            if dt < now or dt > now + timedelta(days=months * 31):
                continue
            ym = dt.strftime("%Y-%m")
            month_buckets[ym].append(event["id"])
            week_start = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
            week_buckets[week_start].append(event["id"])

        for ym, ids in month_buckets.items():
            conn.execute(
                """
                INSERT INTO calendar_months (city_slug, year_month, event_count, built_at)
                VALUES (?, ?, ?, datetime('now'))
                ON CONFLICT(city_slug, year_month) DO UPDATE SET
                    event_count = excluded.event_count,
                    built_at = datetime('now')
                """,
                (city, ym, len(ids)),
            )

        for week_start, ids in week_buckets.items():
            ws_dt = datetime.strptime(week_start, "%Y-%m-%d")
            week_end = (ws_dt + timedelta(days=6)).strftime("%Y-%m-%d")
            conn.execute(
                """
                INSERT INTO calendar_weeks (
                    city_slug, week_start, week_end, event_count, event_ids_json, built_at
                ) VALUES (?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(city_slug, week_start) DO UPDATE SET
                    week_end = excluded.week_end,
                    event_count = excluded.event_count,
                    event_ids_json = excluded.event_ids_json,
                    built_at = datetime('now')
                """,
                (city, week_start, week_end, len(ids), json.dumps(ids)),
            )

        summary["cities"][city] = {
            "months": len(month_buckets),
            "weeks": len(week_buckets),
            "events_in_window": sum(len(v) for v in month_buckets.values()),
        }

    conn.commit()
    return summary
