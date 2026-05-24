"""Discovery ingestion CLI."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Ensure project root (discovery-ingestion/) is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.calendar.build import build_calendar
from src.calendar.trends import compute_trends
from src.cli.observability import (
    RunSummary,
    SourceRunSummary,
    console,
    make_progress_callback,
    print_pre_run_counts,
    print_run_banner,
    print_run_summary,
    print_source_summary,
    save_latest_run,
)
from src.db.connection import get_db_path, init_db, table_counts
from src.export.obsidian import export_all_cities, export_city
from src.pipeline.audit import audit_source, format_audit_report
from src.pipeline.completion import fetch_completion_report
from src.pipeline.orchestrator import ALL_SOURCES, SCRAPE_ORDER, run_scrape
from src.resolve.entity_resolve import resolve_entities
from src.vet.cli import list_pending


def _duration_sec(result) -> float | None:
    if result.started_at and result.finished_at:
        return (result.finished_at - result.started_at).total_seconds()
    return None


def _result_to_summary(result) -> SourceRunSummary:
    meta = result.metadata or {}
    return SourceRunSummary(
        source=result.source_provider,
        city=result.city_slug,
        status=result.status,
        run_id=result.run_id,
        inserted=result.inserted,
        updated=result.updated,
        skipped=result.skipped,
        failed=result.failed,
        records_found=result.records_found,
        completion_pct=meta.get("completion_pct"),
        expected_total=meta.get("expected_total") or result.expected_total,
        errors=list(result.errors),
        sample_fallback=result.sample_fallback,
        duration_sec=_duration_sec(result),
    )


def cmd_scrape(args: argparse.Namespace) -> int:
    conn = init_db()
    db_path = get_db_path()
    before = table_counts(conn)

    if args.all_sources:
        sources = SCRAPE_ORDER
    else:
        if not args.source:
            console.print("[red]Provide --source or use --all-sources[/red]")
            return 1
        sources = [args.source]

    if not args.json:
        print_pre_run_counts(db_path, before)

    run_summary = RunSummary(
        city=args.city,
        before_counts=before,
        db_path=str(db_path),
    )

    def scrape_one(source: str):
        if not args.json:
            print_run_banner(
                source=source,
                city=args.city,
                run_id=None,
                force=args.force,
            )
        progress = None
        on_progress = None
        if not args.json:
            progress, _task_id, on_progress = make_progress_callback(
                source=source,
                label=f"{source} / {args.city}",
            )
        try:
            return run_scrape(
                args.city,
                source,
                conn=conn,
                on_progress=on_progress,
                force=args.force,
                strict_city_filter=getattr(args, "city_filter", "infer") == "strict",
            )
        finally:
            if progress is not None:
                try:
                    progress.stop()
                except UnicodeEncodeError:
                    pass

    if args.all_sources and len(sources) > 1:
        results = []
        for source in sources:
            results.append(scrape_one(source))
    else:
        results = [scrape_one(sources[0])] if len(sources) == 1 else []

    for result in results:
        summary = _result_to_summary(result)
        run_summary.sources.append(summary)
        if not args.json:
            print_source_summary(summary)

    after = table_counts(conn)
    run_summary.after_counts = after
    latest_path = save_latest_run(run_summary)

    if args.json:
        payload = {
            "city": args.city,
            "db_path": str(db_path),
            "latest_run_path": str(latest_path),
            "sources": [
                {
                    "source": s.source,
                    "status": s.status,
                    "inserted": s.inserted,
                    "updated": s.updated,
                    "skipped": s.skipped,
                    "failed": s.failed,
                    "completion_pct": s.completion_pct,
                    "expected_total": s.expected_total,
                    "sample_fallback": s.sample_fallback,
                    "errors": s.errors,
                }
                for s in run_summary.sources
            ],
            "before_counts": before,
            "after_counts": after,
            "exit_code": 1 if run_summary.any_failed else 0,
        }
        if not getattr(args, "no_obsidian_export", False):
            export_paths = export_all_cities(conn)
            payload["obsidian_export_paths"] = [str(p) for p in export_paths]
        print(json.dumps(payload, indent=2))
    else:
        print_run_summary(run_summary)
        if not getattr(args, "no_obsidian_export", False):
            export_paths = export_all_cities(conn)
            console.print("\n[green]Obsidian export[/green]")
            for export_path in export_paths:
                console.print(f"  -> {export_path}")

    return 1 if run_summary.any_failed else 0


def cmd_export_obsidian(args: argparse.Namespace) -> int:
    conn = init_db()
    if args.city == "all":
        paths = export_all_cities(conn)
        for path in paths:
            print(f"Exported -> {path}")
    else:
        path = export_city(conn, args.city)
        print(f"Exported -> {path}")
    return 0


def cmd_vet(args: argparse.Namespace) -> int:
    conn = init_db()
    if args.vet_command == "list":
        rows = list_pending(conn, status=args.status, limit=args.limit)
        if not rows:
            print(f"No entities with status '{args.status}'.")
            return 0
        for row in rows:
            print(
                f"[{row['entity_type']}] id={row['id']} "
                f"{row['name']} ({row['source_provider']}) — {row['city_slug']}"
            )
        return 0
    print("Unknown vet subcommand", file=sys.stderr)
    return 1


def cmd_calendar(args: argparse.Namespace) -> int:
    conn = init_db()
    if args.calendar_command == "build":
        summary = build_calendar(conn, city_slug=args.city, months=args.months)
        print(json.dumps(summary, indent=2))
        if args.city and args.city != "all":
            compute_trends(conn, args.city)
        return 0
    if args.calendar_command == "export-obsidian":
        path = export_city(conn, args.city)
        cal_dir = path / "calendar"
        cal_dir.mkdir(exist_ok=True)
        weeks = conn.execute(
            "SELECT * FROM calendar_weeks WHERE city_slug = ? ORDER BY week_start",
            (args.city,),
        ).fetchall()
        for week in weeks:
            fname = f"week-{week['week_start']}.md"
            content = (
                f"# Week {week['week_start']} → {week['week_end']}\n\n"
                f"**Events:** {week['event_count']}\n"
            )
            (cal_dir / fname).write_text(content, encoding="utf-8")
        print(f"Calendar notes -> {cal_dir}")
        return 0
    print("Unknown calendar subcommand", file=sys.stderr)
    return 1


def cmd_resolve(args: argparse.Namespace) -> int:
    conn = init_db()
    summary = resolve_entities(conn, args.entity_type)
    print(json.dumps(summary, indent=2))
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    conn = init_db()
    counts = table_counts(conn)
    db_path = get_db_path()
    city_filter = getattr(args, "city", None)

    console.print("\n[bold]Discovery Ingestion Report[/bold]")
    console.print("=" * 60)
    console.print(f"Database: {db_path}\n")

    console.print("[bold]Table counts:[/bold]")
    for table, count in counts.items():
        console.print(f"  {table:20s} {count:6d}")

    console.print("\n[bold]Recent scrape runs:[/bold]")
    runs = conn.execute(
        """
        SELECT id, source_provider, city_slug, status, records_found, records_inserted,
               error_message, metadata_json, started_at, finished_at
        FROM scrape_runs
        ORDER BY id DESC
        LIMIT 20
        """
    ).fetchall()
    if not runs:
        console.print("  [dim](none — run `python -m src.main scrape` first)[/dim]")
    else:
        for run in runs:
            meta = {}
            if run["metadata_json"]:
                try:
                    meta = json.loads(run["metadata_json"])
                except json.JSONDecodeError:
                    pass
            pct = meta.get("completion_pct")
            pct_str = f"  {pct:.1f}% coverage" if pct is not None else ""
            err = f"  [red]{run['error_message']}[/red]" if run["error_message"] else ""
            console.print(
                f"  #{run['id']} {run['started_at']}  {run['source_provider']:15s} "
                f"{run['city_slug']:15s}  {run['status']:22s}  "
                f"found={run['records_found']} inserted={run['records_inserted']}"
                f"{pct_str}{err}"
            )

    console.print("\n[bold]Region completion (latest run per source):[/bold]")
    completion = fetch_completion_report(conn, city_filter)
    if not completion:
        console.print("  [dim](no completed runs yet)[/dim]")
    else:
        for row in completion:
            if city_filter and row["city"] != city_filter:
                continue
            pct = row.get("completion_pct")
            pct_label = f"{pct:.1f}%" if pct is not None else "indeterminate"
            expected = row.get("expected_total") or row["records_found"]
            coverage = f"{row['in_db']}/{expected}" if expected else str(row["in_db"])
            fallback = " [yellow]SAMPLE[/yellow]" if row.get("sample_fallback") else ""
            console.print(
                f"  {row['source']:15s} {row['city']:15s}  {row['status']:22s}  "
                f"{coverage} ({pct_label}){fallback}"
            )

    console.print("\n[bold]Vetting summary:[/bold]")
    for table in ("events", "places", "artists", "deals"):
        rows = conn.execute(
            f"SELECT vetting_status, COUNT(*) AS c FROM {table} GROUP BY vetting_status"
        ).fetchall()
        if rows:
            parts = ", ".join(f"{r['vetting_status']}={r['c']}" for r in rows)
            console.print(f"  {table}: {parts}")

    source_filter = getattr(args, "source", None)
    if source_filter:
        console.print(f"\n[bold]Source pipeline audit ({source_filter}):[/bold]")
        title_search = getattr(args, "title", None)
        report = audit_source(conn, source_filter, title_search=title_search)
        for line in format_audit_report(report).splitlines():
            console.print(f"  {line}")

    latest = PROJECT_ROOT / "output" / "latest_run.json"
    if latest.exists():
        console.print(f"\n[dim]Latest run artifact: {latest}[/dim]")

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="discovery-ingestion",
        description="Phase 1 local discovery scraper — SQLite + Obsidian vet pipeline",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    scrape_p = sub.add_parser("scrape", help="Run scraper(s) for a city")
    scrape_p.add_argument("--city", required=True, help="City slug (e.g. johannesburg)")
    scrape_p.add_argument(
        "--source",
        choices=ALL_SOURCES,
        help="Single source provider (omit when using --all-sources)",
    )
    scrape_p.add_argument(
        "--all-sources",
        action="store_true",
        help="Run all sources in build order",
    )
    scrape_p.add_argument(
        "--force",
        action="store_true",
        help="Re-scrape even if content hash is unchanged",
    )
    scrape_p.add_argument(
        "--json",
        action="store_true",
        help="Machine-readable JSON output (no Rich progress)",
    )
    scrape_p.add_argument(
        "--no-obsidian-export",
        action="store_true",
        help="Skip auto-export to Obsidian vault after scrape completes",
    )
    scrape_p.add_argument(
        "--city-filter",
        choices=["infer", "strict"],
        default="infer",
        help="City assignment: infer from location text (default) or strict pre-insert filter",
    )
    scrape_p.set_defaults(func=cmd_scrape)

    export_p = sub.add_parser("export-obsidian", help="Export catalog to Obsidian vault")
    export_p.add_argument("--city", required=True, help="City slug or 'all'")
    export_p.set_defaults(func=cmd_export_obsidian)

    vet_p = sub.add_parser("vet", help="Vetting workflow")
    vet_sub = vet_p.add_subparsers(dest="vet_command", required=True)
    vet_list = vet_sub.add_parser("list", help="List entities by vetting status")
    vet_list.add_argument("--status", default="pending", choices=["pending", "approved", "rejected"])
    vet_list.add_argument("--limit", type=int, default=50)
    vet_p.set_defaults(func=cmd_vet)

    cal_p = sub.add_parser("calendar", help="Calendar aggregation")
    cal_sub = cal_p.add_subparsers(dest="calendar_command", required=True)
    cal_build = cal_sub.add_parser("build", help="Build calendar month/week aggregates")
    cal_build.add_argument("--city", default="all")
    cal_build.add_argument("--months", type=int, default=3)
    cal_export = cal_sub.add_parser("export-obsidian", help="Export calendar notes to Obsidian")
    cal_export.add_argument("--city", required=True)
    cal_p.set_defaults(func=cmd_calendar)

    resolve_p = sub.add_parser("resolve", help="Cross-silo entity deduplication")
    resolve_p.add_argument(
        "--entity-type",
        required=True,
        choices=["artist", "place", "event", "merchant", "organizer"],
    )
    resolve_p.set_defaults(func=cmd_resolve)

    report_p = sub.add_parser("report", help="Show database stats")
    report_p.add_argument("--city", help="Filter completion table to one city")
    report_p.add_argument("--source", help="Audit ingestion vs Obsidian for one source")
    report_p.add_argument("--title", help="Search DB titles when using --source")
    report_p.set_defaults(func=cmd_report)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "scrape" and not args.all_sources and not args.source:
        parser.error("scrape requires --source or --all-sources")
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
