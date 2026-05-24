"""Cross-silo entity resolution — merge duplicates by normalized name + city."""

from __future__ import annotations

import re
import sqlite3
from typing import Any


def normalize_name(name: str) -> str:
    value = name.lower().strip()
    value = re.sub(r"[^\w\s]", "", value)
    value = re.sub(r"\s+", " ", value)
    # Strip common suffixes
    for suffix in (" sa", " pty ltd", " (pty) ltd", " live", " official"):
        if value.endswith(suffix):
            value = value[: -len(suffix)].strip()
    return value


def resolve_entities(
    conn: sqlite3.Connection,
    entity_type: str,
) -> dict[str, Any]:
    table_map = {
        "artist": ("artists", "name"),
        "place": ("places", "name"),
        "event": ("events", "name"),
        "merchant": ("merchants", "name"),
        "organizer": ("organizers", "name"),
    }
    if entity_type not in table_map:
        raise ValueError(f"Unsupported entity type: {entity_type}")

    table, name_col = table_map[entity_type]
    rows = conn.execute(
        f"""
        SELECT id, {name_col} AS name, city_slug, source_provider, source_external_id
        FROM {table}
        ORDER BY city_slug, {name_col}
        """
    ).fetchall()

    groups: dict[tuple[str, str], list[sqlite3.Row]] = {}
    for row in rows:
        key = (row["city_slug"], normalize_name(row["name"]))
        groups.setdefault(key, []).append(row)

    aliases_written = 0
    merges = 0

    for (city, norm_name), members in groups.items():
        if len(members) < 2:
            continue
        merges += 1
        canonical = members[0]
        for alias_row in members[1:]:
            conn.execute(
                """
                INSERT OR IGNORE INTO entity_aliases (
                    entity_type, canonical_entity_id, alias_name,
                    alias_source_provider, alias_source_external_id, city_slug
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    entity_type,
                    canonical["id"],
                    alias_row["name"],
                    alias_row["source_provider"],
                    alias_row["source_external_id"],
                    city,
                ),
            )
            aliases_written += 1

    conn.commit()
    return {
        "entity_type": entity_type,
        "groups_merged": merges,
        "aliases_written": aliases_written,
        "total_entities": len(rows),
    }
