"""Audit ingestion vs export pipeline for a source provider."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from src.export.obsidian import DISCOVERY_CATALOG_FOLDER, vault_root
from src.pipeline.completion import entity_table_for_source

SOURCE_ENTITY_MAP: dict[str, str] = {
    "quicket": "events",
    "howler": "events",
    "airdosh": "events",
    "fever": "events",
    "bandsintown": "events",
    "webtickets": "events",
    "computicket": "events",
    "google_places": "places",
    "fomosa": "deals",
    "hyperli": "deals",
    "menu_web": "menu_items",
}


def _obsidian_entity_count(source: str, entity_folder: str) -> dict[str, int]:
    vault = vault_root()
    catalog = vault.joinpath(*[p for p in DISCOVERY_CATALOG_FOLDER.split("/") if p])
    counts: dict[str, int] = {}
    if not catalog.is_dir():
        return counts
    for city_dir in catalog.iterdir():
        if not city_dir.is_dir():
            continue
        source_dir = city_dir / entity_folder / source
        if not source_dir.is_dir():
            continue
        notes = [p for p in source_dir.rglob("*.md") if p.name != "_index.md"]
        if notes:
            counts[city_dir.name] = len(notes)
    return counts


def audit_source(
    conn: sqlite3.Connection,
    source: str,
    *,
    title_search: str | None = None,
) -> dict:
    entity_table = entity_table_for_source(source) or SOURCE_ENTITY_MAP.get(source, "events")
    entity_folder = {
        "events": "events",
        "places": "places",
        "artists": "artists",
        "deals": "deals",
    }.get(entity_table, entity_table)

    name_col = "title" if entity_table == "deals" else "name"

    db_by_city = {
        row["city_slug"]: row["c"]
        for row in conn.execute(
            f"""
            SELECT city_slug, COUNT(*) AS c
            FROM {entity_table}
            WHERE source_provider = ?
            GROUP BY city_slug
            ORDER BY c DESC
            """,
            (source,),
        ).fetchall()
    }
    db_total = sum(db_by_city.values())

    obs_by_city = _obsidian_entity_count(source, entity_folder)
    obs_total = sum(obs_by_city.values())

    run = conn.execute(
        """
        SELECT id, city_slug, status, records_found, records_inserted, metadata_json, started_at
        FROM scrape_runs
        WHERE source_provider = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (source,),
    ).fetchone()

    meta: dict = {}
    listings_crawled = None
    if run and run["metadata_json"]:
        try:
            meta = json.loads(run["metadata_json"])
            listings_crawled = meta.get("listings_crawled") or meta.get("listings_seen")
        except json.JSONDecodeError:
            pass

    filtered_out = None
    if listings_crawled is not None and run:
        filtered_out = max(int(listings_crawled) - int(run["records_found"]), 0)

    title_hits: list[dict] = []
    if title_search:
        pattern = f"%{title_search.lower()}%"
        if entity_table in ("events", "places", "artists", "deals"):
            col = name_col
            rows = conn.execute(
                f"""
                SELECT city_slug, {col} AS label, source_provider
                FROM {entity_table}
                WHERE source_provider = ? AND lower({col}) LIKE ?
                """,
                (source, pattern),
            ).fetchall()
            title_hits = [dict(r) for r in rows]

    export_gap = db_total - obs_total

    return {
        "source": source,
        "entity_table": entity_table,
        "db_total": db_total,
        "db_by_city": db_by_city,
        "obsidian_total": obs_total,
        "obsidian_by_city": obs_by_city,
        "export_matches_db": export_gap == 0,
        "export_gap": export_gap,
        "latest_run": dict(run) if run else None,
        "listings_crawled": listings_crawled,
        "records_found_last_run": run["records_found"] if run else None,
        "filtered_out_estimate": filtered_out,
        "run_metadata": meta,
        "title_search": title_search,
        "title_hits": title_hits,
    }


def format_audit_report(report: dict) -> str:
    lines = [
        f"Source audit: {report['source']} ({report['entity_table']})",
        f"  DB total:       {report['db_total']}",
        f"  Obsidian total: {report['obsidian_total']}  "
        f"({'OK' if report['export_matches_db'] else f'gap {report['export_gap']}'})",
    ]
    if report["listings_crawled"] is not None:
        lines.append(
            f"  Last crawl:     {report['listings_crawled']} listings -> "
            f"{report['records_found_last_run']} accepted "
            f"(~{report['filtered_out_estimate']} filtered at ingestion)"
        )
    if report["db_by_city"]:
        lines.append("  DB by city:")
        for city, count in report["db_by_city"].items():
            obs = report["obsidian_by_city"].get(city, 0)
            lines.append(f"    {city:15s} db={count} obsidian={obs}")
    if report["title_search"]:
        lines.append(f"  Title search '{report['title_search']}': {len(report['title_hits'])} hits")
        for hit in report["title_hits"][:10]:
            lines.append(f"    [{hit['city_slug']}] {hit['label']}")
    return "\n".join(lines)
