"""Rich-based CLI observability — progress bars, banners, run summaries."""

from __future__ import annotations

import json
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from rich.console import Console
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)

console = Console(force_terminal=True, legacy_windows=False)


def _safe_console_text(text: str, *, max_len: int = 120) -> str:
    cleaned = (text or "").replace("\n", " ").strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[: max_len - 1] + "…"
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    try:
        return cleaned.encode(encoding, errors="replace").decode(encoding, errors="replace")
    except Exception:
        return cleaned.encode("ascii", errors="replace").decode("ascii")


def _progress_columns() -> list:
    """Spinner braille chars break cp1252 Windows consoles — omit on Windows."""
    cols: list = []
    if os.name != "nt" and sys.stdout.encoding and sys.stdout.encoding.lower().startswith("utf"):
        cols.append(SpinnerColumn())
    cols.extend(
        [
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
        ]
    )
    return cols

ProgressCallback = Callable[[int, int, str, dict[str, Any]], None]

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LATEST_RUN_PATH = PROJECT_ROOT / "output" / "latest_run.json"
CHECKPOINT_DIR = PROJECT_ROOT / "output" / "checkpoints"


def outcome_label(info: dict[str, Any]) -> str:
    if info.get("not_implemented"):
        return "not wired"
    if info.get("sample_fallback"):
        return "SAMPLE FALLBACK"
    outcome = info.get("outcome") or info.get("status") or "processed"
    if outcome == "skipped":
        reason = info.get("skip_reason", "fresh")
        return f"skipped ({reason})"
    return str(outcome)


def print_run_banner(
    *,
    source: str,
    city: str,
    run_id: int | None,
    entity_type: str = "mixed",
    force: bool = False,
) -> None:
    console.print(f"\n[bold]{'=' * 70}[/bold]")
    console.print("[bold]DISCOVERY SCRAPE[/bold]")
    console.print(f"[bold]{'=' * 70}[/bold]")
    console.print(f"Source:     [cyan]{source}[/cyan]")
    console.print(f"City:       [cyan]{city}[/cyan]")
    console.print(f"Entity:     {entity_type}")
    console.print(f"Run ID:     {run_id if run_id is not None else 'pending'}")
    console.print(f"Force:      {'yes' if force else 'no'}")
    console.print(f"Started:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    console.print(f"[bold]{'=' * 70}[/bold]\n")


def print_pre_run_counts(db_path: Path, counts: dict[str, int]) -> None:
    console.print(f"[dim]Database:[/dim] {db_path}")
    console.print("[dim]Table counts (before):[/dim]")
    for table, count in counts.items():
        console.print(f"  {table:20s} {count:6d}")
    console.print()


def print_table_deltas(before: dict[str, int], after: dict[str, int]) -> None:
    console.print("\n[bold]Table deltas:[/bold]")
    any_delta = False
    for table in before:
        delta = after.get(table, 0) - before.get(table, 0)
        if delta != 0:
            any_delta = True
            sign = "+" if delta > 0 else ""
            console.print(
                f"  {table:20s} {before[table]:6d} -> {after[table]:6d}  "
                f"([green]{sign}{delta}[/green])"
            )
    if not any_delta:
        console.print("  [dim](no table count changes)[/dim]")


@dataclass
class SourceRunSummary:
    source: str
    city: str
    status: str
    run_id: int | None = None
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    records_found: int = 0
    completion_pct: float | None = None
    expected_total: int | None = None
    errors: list[str] = field(default_factory=list)
    sample_fallback: bool = False
    duration_sec: float | None = None


@dataclass
class RunSummary:
    city: str
    sources: list[SourceRunSummary] = field(default_factory=list)
    before_counts: dict[str, int] = field(default_factory=dict)
    after_counts: dict[str, int] = field(default_factory=dict)
    db_path: str = ""
    latest_run_path: str = ""

    @property
    def any_failed(self) -> bool:
        return any(s.status == "failed" for s in self.sources)

    @property
    def any_warnings(self) -> bool:
        return any(
            s.status == "completed_with_warnings" or s.sample_fallback or s.errors
            for s in self.sources
        )


def print_source_summary(summary: SourceRunSummary) -> None:
    pct = (
        f"{summary.completion_pct:.1f}% region coverage"
        if summary.completion_pct is not None
        else "completion indeterminate"
    )
    expected = summary.expected_total or summary.records_found
    coverage = f"{summary.records_found}/{expected}" if expected else str(summary.records_found)

    status_style = "green"
    if summary.status == "failed":
        status_style = "red"
    elif summary.status == "completed_with_warnings" or summary.sample_fallback:
        status_style = "yellow"

    console.print(
        f"\n[{status_style}]{summary.source}/{summary.city}[/{status_style}] — "
        f"{coverage} ({pct}) | "
        f"+{summary.inserted} inserted, {summary.updated} updated, "
        f"{summary.skipped} skipped, {summary.failed} failed"
        + (f" | {summary.duration_sec:.1f}s" if summary.duration_sec else "")
    )
    if summary.sample_fallback:
        console.print("  [yellow]WARN SAMPLE FALLBACK — not live API data[/yellow]")
    for err in summary.errors:
        console.print(f"  [yellow]warning:[/yellow] {err}")


def print_run_summary(summary: RunSummary) -> None:
    console.print(f"\n[bold]{'=' * 70}[/bold]")
    if summary.any_failed:
        console.print("[bold red]SCRAPE FINISHED WITH FAILURES[/bold red]")
    elif summary.any_warnings:
        console.print("[bold yellow]SCRAPE FINISHED WITH WARNINGS[/bold yellow]")
    else:
        console.print("[bold green]SCRAPE COMPLETE[/bold green]")
    console.print(f"[bold]{'=' * 70}[/bold]")
    console.print(f"  Database:  {summary.db_path}")
    if summary.latest_run_path:
        console.print(f"  Latest run: {summary.latest_run_path}")
    print_table_deltas(summary.before_counts, summary.after_counts)
    console.print()


def make_progress_callback(
    *,
    source: str,
    label: str,
) -> tuple[Progress, int, ProgressCallback]:
    progress = Progress(
        *_progress_columns(),
        console=console,
        refresh_per_second=4,
    )
    task_id_holder: list[int] = [0]

    def on_progress(done: int, total: int, item_label: str, info: dict[str, Any]) -> None:
        suffix = outcome_label(info)
        phase = info.get("phase", "")
        phase_prefix = f"{phase} " if phase else ""
        desc = f"[{done}/{total}] {source} — {phase_prefix}{_safe_console_text(item_label)} — {suffix}"
        if task_id_holder[0]:
            progress.update(task_id_holder[0], completed=done, total=max(total, 1), description=desc)
        write_checkpoint(source, info.get("city", ""), done, total, item_label, info)

    progress.start()
    task_id_holder[0] = progress.add_task(label, total=1)
    return progress, task_id_holder[0], on_progress


def write_checkpoint(
    source: str,
    city: str,
    done: int,
    total: int,
    item_label: str,
    info: dict[str, Any],
) -> None:
    if done % 5 != 0 and done != total:
        return
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    path = CHECKPOINT_DIR / f"{source}_{city}.json"
    payload = {
        "source": source,
        "city": city,
        "done": done,
        "total": total,
        "last_item": item_label,
        "info": info,
        "timestamp": datetime.now().isoformat(),
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def save_latest_run(summary: RunSummary) -> Path:
    LATEST_RUN_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "city": summary.city,
        "db_path": summary.db_path,
        "timestamp": datetime.now().isoformat(),
        "sources": [
            {
                "source": s.source,
                "status": s.status,
                "inserted": s.inserted,
                "updated": s.updated,
                "skipped": s.skipped,
                "failed": s.failed,
                "completion_pct": s.completion_pct,
                "errors": s.errors,
            }
            for s in summary.sources
        ],
        "before_counts": summary.before_counts,
        "after_counts": summary.after_counts,
    }
    LATEST_RUN_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    summary.latest_run_path = str(LATEST_RUN_PATH)
    return LATEST_RUN_PATH


def print_skip_preview(source: str, city: str, to_fetch: int, already_fresh: int) -> None:
    if already_fresh > 0 and to_fetch == 0:
        console.print(
            f"[yellow]All {already_fresh} {source}/{city} rows already fresh — "
            f"use --force to re-scrape.[/yellow]"
        )
    elif already_fresh > 0:
        console.print(
            f"[dim]{already_fresh} already fresh, {to_fetch} to fetch for {source}/{city}[/dim]"
        )
