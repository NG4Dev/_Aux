import sqlite3
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.scrapers.howler_algolia import (
    fetch_howler_events,
    event_city_slug,
    resolve_algolia_config,
    algolia_url,
)
import httpx

conn = sqlite3.connect("data/discovery.db")
conn.row_factory = sqlite3.Row

print("=== DB search howler ===")
for term in ("divine", "rapture", "katys", "awe"):
    rows = conn.execute(
        "SELECT name, city_slug, external_ticketing_url FROM events "
        "WHERE source_provider='howler' AND lower(name) LIKE ?",
        (f"%{term}%",),
    ).fetchall()
    if rows:
        print(term, len(rows))
        for r in rows:
            print(" ", r["city_slug"], r["name"][:70])

print("howler total", conn.execute("SELECT COUNT(*) c FROM events WHERE source_provider='howler'").fetchone()["c"])

app_id, api_key = resolve_algolia_config({})
print("\n=== Algolia search divine rapture ===")
with httpx.Client(timeout=30) as client:
    resp = client.post(
        algolia_url(app_id),
        json={"query": "divine rapture sandton", "hitsPerPage": 20},
        headers={"X-Algolia-Application-Id": app_id, "X-Algolia-API-Key": api_key},
    )
    data = resp.json()
    for hit in data.get("hits", []):
        name = hit.get("name")
        venue = hit.get("venue") or {}
        addr = venue.get("address", "")
        og = hit.get("og_url", "")
        in_jhb = event_city_slug(hit) == "johannesburg"
        print(f"  in_jhb={in_jhb} | {name}")
        print(f"    addr={addr}")
        print(f"    og_url={og}")

    events, raw = fetch_howler_events(app_id=app_id, api_key=api_key, client=client, city_query="Johannesburg")
    jhb = [e for e in events if e.get("assigned_city_slug") == "johannesburg"]
    print(f"\nfetch_howler_events: {len(events)} assigned from {raw} raw hits ({len(jhb)} johannesburg)")
    for e in events:
        if "divine" in e["name"].lower() or "rapture" in e["name"].lower():
            print("  FOUND", e.get("assigned_city_slug"), e["name"], e.get("url"))
