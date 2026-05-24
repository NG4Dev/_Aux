"""Region completion metrics per city + source."""

from __future__ import annotations

import json
import sqlite3
from typing import Any


def count_entities_for_source(
    conn: sqlite3.Connection,
    *,
    source: str,
    city_slug: str,
    entity_table: str,
) -> int:
    if entity_table == "menu_items":
        row = conn.execute(
            """
            SELECT COUNT(*) AS c FROM menu_items mi
            INNER JOIN places p ON p.id = mi.place_id
            WHERE mi.source_provider = ? AND p.city_slug = ?
            """,
            (source, city_slug),
        ).fetchone()
    else:
        row = conn.execute(
            f"""
            SELECT COUNT(*) AS c FROM {entity_table}
            WHERE source_provider = ? AND city_slug = ?
            """,
            (source, city_slug),
        ).fetchone()
    return int(row["c"]) if row else 0


def entity_table_for_source(source: str) -> str:
    if source in ("google_places",):
        return "places"
    if source in ("fomosa", "hyperli"):
        return "deals"
    if source == "menu_web":
        return "menu_items"
    return "events"


def compute_completion_pct(
    *,
    in_db: int,
    skipped_fresh: int,
    inserted: int,
    updated: int,
    expected_total: int | None,
) -> float | None:
    if not expected_total or expected_total <= 0:
        return None
    covered = in_db
    return min(100.0, (covered / expected_total) * 100.0)


def build_run_metadata(
    *,
    inserted: int,
    updated: int,
    skipped: int,
    skipped_fresh: int,
    failed: int,
    records_found: int,
    expected_total: int | None = None,
    pages_done: int | None = None,
    pages_total: int | None = None,
    sample_fallback: bool = False,
    in_db_after: int | None = None,
) -> dict[str, Any]:
    completion_pct = None
    if expected_total and expected_total > 0 and in_db_after is not None:
        completion_pct = min(100.0, (in_db_after / expected_total) * 100.0)
    elif expected_total and expected_total > 0:
        completion_pct = compute_completion_pct(
            in_db=records_found,
            skipped_fresh=skipped_fresh,
            inserted=inserted,
            updated=updated,
            expected_total=expected_total,
        )

    return {
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "skipped_fresh": skipped_fresh,
        "failed": failed,
        "expected_total": expected_total,
        "pages_done": pages_done,
        "pages_total": pages_total,
        "sample_fallback": sample_fallback,
        "completion_pct": completion_pct,
        "in_db_after": in_db_after,
    }


def fetch_completion_report(conn: sqlite3.Connection, city_slug: str | None = None) -> list[dict[str, Any]]:
    """Latest completed run per source (+ city) with completion metadata."""
    params: list[Any] = []
    city_filter = ""
    if city_slug and city_slug != "all":
        city_filter = "AND city_slug = ?"
        params.append(city_slug)

    rows = conn.execute(
        f"""
        SELECT sr.*
        FROM scrape_runs sr
        INNER JOIN (
            SELECT source_provider, city_slug, MAX(id) AS max_id
            FROM scrape_runs
            WHERE status IN ('completed', 'completed_with_warnings', 'failed')
            {city_filter}
            GROUP BY source_provider, city_slug
        ) latest ON sr.id = latest.max_id
        ORDER BY sr.city_slug, sr.source_provider
        """,
        params,
    ).fetchall()

    report: list[dict[str, Any]] = []
    for row in rows:
        meta: dict[str, Any] = {}
        if row["metadata_json"]:
            try:
                meta = json.loads(row["metadata_json"])
            except json.JSONDecodeError:
                meta = {}
        entity_table = entity_table_for_source(row["source_provider"])
        in_db = count_entities_for_source(
            conn,
            source=row["source_provider"],
            city_slug=row["city_slug"],
            entity_table=entity_table,
        )
        report.append(
            {
                "source": row["source_provider"],
                "city": row["city_slug"],
                "status": row["status"],
                "started_at": row["started_at"],
                "finished_at": row["finished_at"],
                "records_found": row["records_found"],
                "records_inserted": row["records_inserted"],
                "error_message": row["error_message"],
                "in_db": in_db,
                "completion_pct": meta.get("completion_pct"),
                "expected_total": meta.get("expected_total"),
                "inserted": meta.get("inserted"),
                "updated": meta.get("updated"),
                "skipped": meta.get("skipped"),
                "sample_fallback": meta.get("sample_fallback"),
            }
        )
    return report
