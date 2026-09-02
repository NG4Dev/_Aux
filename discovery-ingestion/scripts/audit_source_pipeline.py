"""CLI: compare crawled vs DB vs Obsidian for a source."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.db.connection import init_db
from src.pipeline.audit import audit_source, format_audit_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit ingestion vs Obsidian export for a source")
    parser.add_argument("--source", required=True, help="source_provider e.g. webtickets")
    parser.add_argument("--title", help="Search DB for title fragment")
    args = parser.parse_args()

    conn = init_db()
    report = audit_source(conn, args.source, title_search=args.title)
    print(format_audit_report(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
