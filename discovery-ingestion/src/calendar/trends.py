"""Trend signal computation from scraped data."""

from __future__ import annotations

import json
import sqlite3
from collections import Counter


def compute_trends(conn: sqlite3.Connection, city_slug: str) -> dict[str, int]:
    """Compute simple trend signals: events per source, top venues."""
    inserted = 0

    by_source = conn.execute(
        """
        SELECT source_provider, COUNT(*) AS c
        FROM events WHERE city_slug = ?
        GROUP BY source_provider
        """,
        (city_slug,),
    ).fetchall()

    for row in by_source:
        conn.execute(
            """
            INSERT INTO trend_signals (
                city_slug, signal_type, signal_key, signal_value, metadata_json
            ) VALUES (?, 'events_by_source', ?, ?, ?)
            ON CONFLICT(city_slug, signal_type, signal_key, window_start) DO UPDATE SET
                signal_value = excluded.signal_value,
                computed_at = datetime('now')
            """,
            (
                city_slug,
                row["source_provider"],
                float(row["c"]),
                json.dumps({"count": row["c"]}),
            ),
        )
        inserted += 1

    venues = conn.execute(
        """
        SELECT location, COUNT(*) AS c
        FROM events
        WHERE city_slug = ? AND location IS NOT NULL
        GROUP BY location
        ORDER BY c DESC
        LIMIT 10
        """,
        (city_slug,),
    ).fetchall()

    venue_counter = Counter({r["location"]: r["c"] for r in venues})
    for venue, count in venue_counter.items():
        conn.execute(
            """
            INSERT INTO trend_signals (
                city_slug, signal_type, signal_key, signal_value, metadata_json
            ) VALUES (?, 'top_venue', ?, ?, ?)
            ON CONFLICT(city_slug, signal_type, signal_key, window_start) DO UPDATE SET
                signal_value = excluded.signal_value,
                computed_at = datetime('now')
            """,
            (city_slug, venue, float(count), json.dumps({"event_count": count})),
        )
        inserted += 1

    conn.commit()
    return {"signals_written": inserted}
