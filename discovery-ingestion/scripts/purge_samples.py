"""Remove placeholder sample rows from discovery.db."""
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "data" / "discovery.db"
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

tables = [
    ("events", "source_external_id"),
    ("places", "source_external_id"),
    ("deals", "source_external_id"),
    ("artists", "source_external_id"),
]

for table, col in tables:
    cur = conn.execute(
        f"DELETE FROM {table} WHERE {col} LIKE 'sample-%' OR {col} LIKE 'sample_%'"
    )
    print(f"{table}: deleted {cur.rowcount} sample rows")

conn.commit()
conn.close()
print("done")
