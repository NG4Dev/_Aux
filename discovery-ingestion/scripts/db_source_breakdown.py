"""Quick DB breakdown by source."""
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "data" / "discovery.db"
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row


def by_source(table: str, city: str | None = None) -> list[sqlite3.Row]:
    q = f"SELECT source_provider, COUNT(*) AS c FROM {table}"
    params: list[str] = []
    if city:
        q += " WHERE city_slug = ?"
        params.append(city)
    q += " GROUP BY source_provider ORDER BY c DESC"
    return conn.execute(q, params).fetchall()


print("=== TABLE TOTALS ===")
for table in ("events", "deals", "places", "artists", "listing_signals", "source_links"):
    n = conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
    print(f"  {table:20s} {n}")

print("\n=== EVENTS by source ===")
for r in by_source("events"):
    print(f"  {r['source_provider']:20s} {r['c']}")

print("\n=== DEALS by source ===")
for r in by_source("deals"):
    print(f"  {r['source_provider']:20s} {r['c']}")

print("\n=== PLACES by source ===")
for r in by_source("places"):
    print(f"  {r['source_provider']:20s} {r['c']}")

print("\n=== ARTISTS by source ===")
for r in by_source("artists"):
    print(f"  {r['source_provider']:20s} {r['c']}")

print("\n=== JOHANNESBURG only ===")
for table in ("events", "deals", "places", "artists"):
    rows = by_source(table, "johannesburg")
    if rows:
        parts = ", ".join(f"{r['source_provider']}={r['c']}" for r in rows)
        print(f"  {table}: {parts}")

print("\n=== EVENTS by city ===")
for r in conn.execute(
    "SELECT city_slug, COUNT(*) AS c FROM events GROUP BY city_slug ORDER BY c DESC"
).fetchall():
    print(f"  {r['city_slug']:15s} {r['c']}")

print("\n=== DEALS by city ===")
for r in conn.execute(
    "SELECT city_slug, COUNT(*) AS c FROM deals GROUP BY city_slug ORDER BY c DESC"
).fetchall():
    print(f"  {r['city_slug']:15s} {r['c']}")

print("\n=== Latest runs (deal + place sources) ===")
for src in ("hyperli", "fomosa", "google_places", "webtickets", "computicket", "menu_web"):
    runs = conn.execute(
        """
        SELECT id, status, records_found, records_inserted, error_message, started_at
        FROM scrape_runs WHERE source_provider = ? ORDER BY id DESC LIMIT 2
        """,
        (src,),
    ).fetchall()
    if not runs:
        print(f"  {src}: NO RUNS")
        continue
    for r in runs:
        err = (r["error_message"] or "")[:100]
        print(
            f"  {src} #{r['id']} {r['status']:22s} "
            f"found={r['records_found']} ins={r['records_inserted']} {r['started_at']} {err}"
        )

print("\n=== Obsidian export would include (JHB entity rows) ===")
total = 0
for table in ("events", "places", "artists", "deals"):
    n = conn.execute(
        f"SELECT COUNT(*) AS c FROM {table} WHERE city_slug = 'johannesburg'"
    ).fetchone()["c"]
    total += n
    print(f"  {table}: {n}")
print(f"  TOTAL exported entity notes: {total}")
