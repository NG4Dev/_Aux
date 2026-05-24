"""Database connection and initialization."""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "discovery.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def get_db_path() -> Path:
    env_path = os.getenv("DISCOVERY_DB_PATH")
    if env_path:
        p = Path(env_path)
        return p if p.is_absolute() else PROJECT_ROOT / p
    return DEFAULT_DB_PATH


def get_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 30000")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db(conn: sqlite3.Connection | None = None) -> sqlite3.Connection:
    own_conn = conn is None
    db = conn or get_connection()
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    db.executescript(schema_sql)
    _migrate(db)
    db.commit()
    if own_conn:
        return db
    return db


_MIGRATION_COLUMNS: list[tuple[str, str, str]] = [
    ("places", "content_hash", "TEXT"),
    ("places", "last_scraped_at", "TEXT"),
    ("events", "content_hash", "TEXT"),
    ("events", "last_scraped_at", "TEXT"),
    ("artists", "content_hash", "TEXT"),
    ("artists", "last_scraped_at", "TEXT"),
    ("deals", "content_hash", "TEXT"),
    ("deals", "last_scraped_at", "TEXT"),
]


def _migrate(conn: sqlite3.Connection) -> None:
    for table, column, col_type in _MIGRATION_COLUMNS:
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        except sqlite3.OperationalError:
            pass
    _migrate_scrape_runs_status(conn)


def _migrate_scrape_runs_status(conn: sqlite3.Connection) -> None:
    row = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='scrape_runs'"
    ).fetchone()
    if not row or not row["sql"]:
        return
    if "completed_with_warnings" in row["sql"]:
        return
    conn.executescript(
        """
        CREATE TABLE scrape_runs_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_provider TEXT NOT NULL,
            city_slug TEXT NOT NULL,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            finished_at TEXT,
            status TEXT NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'completed', 'completed_with_warnings', 'failed')),
            records_found INTEGER DEFAULT 0,
            records_inserted INTEGER DEFAULT 0,
            error_message TEXT,
            metadata_json TEXT
        );
        INSERT INTO scrape_runs_new SELECT * FROM scrape_runs;
        DROP TABLE scrape_runs;
        ALTER TABLE scrape_runs_new RENAME TO scrape_runs;
        """
    )


def table_counts(conn: sqlite3.Connection) -> dict[str, int]:
    tables = [
        "places",
        "events",
        "artists",
        "event_performers",
        "merchants",
        "organizers",
        "entity_aliases",
        "listing_signals",
        "calendar_months",
        "calendar_weeks",
        "trend_signals",
        "deals",
        "menu_items",
        "catalog_items",
        "source_links",
        "scrape_runs",
    ]
    counts: dict[str, int] = {}
    for table in tables:
        row = conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()
        counts[table] = int(row["c"]) if row else 0
    return counts
