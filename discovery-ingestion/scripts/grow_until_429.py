"""Run grow scrapes until Google Places returns 429."""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MAX_RUNS = 25
PROBE_RETRY_WAIT_SEC = 90
MAX_PROBE_RETRIES = 10


def run_scrape() -> dict:
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "src.main",
            "scrape",
            "--city",
            "johannesburg",
            "--source",
            "google_places",
            "--incremental",
            "--force",
            "--no-obsidian-export",
            "--json",
        ],
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
    )
    if result.returncode not in (0, 1):
        print("SCRAPER EXIT", result.returncode, file=sys.stderr)
        print(result.stderr[:1000], file=sys.stderr)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        print(result.stdout[:1000], file=sys.stderr)
        print(result.stderr[:1000], file=sys.stderr)
        raise exc


def is_rate_limited(src: dict) -> bool:
    errors = " ".join(src.get("errors") or [])
    meta = src.get("metadata") or {}
    if meta.get("stopped_reason") == "rate_limited":
        return True
    lowered = errors.lower()
    return "429" in errors or "rate-limited" in lowered or "rate limited" in lowered


def main() -> int:
    runs = 0
    probe_retries = 0
    start_places: int | None = None
    places = 0

    while runs < MAX_RUNS:
        runs += 1
        data = run_scrape()
        src = data["sources"][0]
        places = int(data["after_counts"]["places"])
        if start_places is None:
            start_places = int(data["before_counts"]["places"])

        errors = src.get("errors") or []
        err_preview = "; ".join(errors)[:160]
        print(
            f"Run {runs}: status={src['status']} inserted={src['inserted']} "
            f"places={places} errors={err_preview!r}",
            flush=True,
        )

        if is_rate_limited(src):
            if src["inserted"] == 0 and probe_retries < MAX_PROBE_RETRIES:
                probe_retries += 1
                runs -= 1
                print(
                    f"Probe 429 — waiting {PROBE_RETRY_WAIT_SEC}s "
                    f"(retry {probe_retries}/{MAX_PROBE_RETRIES})...",
                    flush=True,
                )
                time.sleep(PROBE_RETRY_WAIT_SEC)
                continue
            print("STOP: rate limit hit", flush=True)
            break

    print(
        f"Done after {runs} grow runs. places {start_places} -> {places} "
        f"(+{(places - (start_places or places))})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
