"""Vetting CLI helpers."""

from __future__ import annotations

import sqlite3
from typing import Any


VETTABLE_TABLES = ["events", "places", "artists", "merchants", "organizers", "deals"]


def list_pending(
    conn: sqlite3.Connection,
    *,
    status: str = "pending",
    limit: int = 50,
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for table in VETTABLE_TABLES:
        name_col = "title" if table == "deals" else "name"
        rows = conn.execute(
            f"""
            SELECT id, '{table}' AS entity_type, source_provider, source_external_id,
                   city_slug, vetting_status, {name_col} AS name
            FROM {table}
            WHERE vetting_status = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (status, limit),
        ).fetchall()
        results.extend(dict(r) for r in rows)
    return results[:limit]


def set_status(
    conn: sqlite3.Connection,
    entity_type: str,
    entity_id: int,
    status: str,
) -> bool:
    table_map = {
        "event": "events",
        "place": "places",
        "artist": "artists",
        "merchant": "merchants",
        "organizer": "organizers",
        "deal": "deals",
    }
    table = table_map.get(entity_type, entity_type)
    if table not in VETTABLE_TABLES:
        raise ValueError(f"Unknown entity type: {entity_type}")
    if status not in ("pending", "approved", "rejected"):
        raise ValueError(f"Invalid status: {status}")

    cur = conn.execute(
        f"UPDATE {table} SET vetting_status = ?, updated_at = datetime('now') WHERE id = ?",
        (status, entity_id),
    )
    conn.commit()
    return cur.rowcount > 0
