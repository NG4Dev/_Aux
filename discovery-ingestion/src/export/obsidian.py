"""Obsidian vault exporter for vetted discovery catalog."""

from __future__ import annotations

import os
import re
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from src.db.connection import get_db_path
from src.scrapers.base import load_cities

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_DIR = PROJECT_ROOT / "templates" / "obsidian"

DEFAULT_VAULT_PATH = Path(r"C:\Users\User\Desktop\Mission Control")
DISCOVERY_CATALOG_FOLDER = "business/discovery-catalog"

ENTITY_TABLES: list[tuple[str, str, str]] = [
    ("events", "event", "events"),
    ("places", "place", "places"),
    ("artists", "artist", "artists"),
    ("deals", "deal", "deals"),
]

MAX_NOTE_PATH_LEN = 200
MAX_DISPLAY_NAME_LEN = 120
MAX_SLUG_FILENAME_LEN = 40

_TITLE_NOISE_PATTERNS = (
    re.compile(r"\s*\|\s*Booked with FOMO.*$", re.I),
    re.compile(r"\s*\|\s*Hyperli.*$", re.I),
    re.compile(r"\s*\|\s*From R[\d\s,]+.*$", re.I),
    re.compile(r"\s*\|\s*R[\d\s,]+.*$", re.I),
    re.compile(r"\s*\|\s*[\d.]+\s*stars?.*$", re.I),
    re.compile(r"\s*\|\s*[\d.]+\s*\(\d+\).*reviews?.*$", re.I),
    re.compile(r"\s*\|\s*Save up to \d+%.*$", re.I),
    re.compile(r"\s*\|\s*Up to \d+% off.*$", re.I),
    re.compile(r"\s*\|\s*Deal\s*$", re.I),
    re.compile(r"\s*\|\s*$"),
)


def vault_root() -> Path:
    raw = os.getenv("OBSIDIAN_VAULT_PATH", "").strip()
    if raw:
        return Path(raw)
    return DEFAULT_VAULT_PATH


def resolve_city_dir(city_slug: str) -> Path:
    parts = [p for p in DISCOVERY_CATALOG_FOLDER.split("/") if p]
    target = vault_root().joinpath(*parts, city_slug)
    target.mkdir(parents=True, exist_ok=True)
    return target


def resolve_entity_dir(
    city_slug: str,
    entity_folder: str,
    source_provider: str,
    subfolder: str | None = None,
) -> Path:
    city_dir = resolve_city_dir(city_slug)
    parts = [entity_folder, source_provider]
    if subfolder:
        parts.append(subfolder)
    target = city_dir.joinpath(*parts)
    target.mkdir(parents=True, exist_ok=True)
    return target


def slugify(value: str, *, fallback: str = "item") -> str:
    text = (value or "").strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:80] if text else fallback


def _parse_month(value: str | None) -> str:
    if not value:
        return "unknown-date"
    text = value.strip()
    if len(text) >= 7 and text[4] == "-":
        return text[:7]
    match = re.match(r"(\d{4})-(\d{2})", text)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    return "unknown-date"


def entity_subfolder(table: str, row: sqlite3.Row) -> str | None:
    if table == "events":
        return _parse_month(row["start_datetime"] if "start_datetime" in row.keys() else None)
    if table == "places":
        kind = row["place_kind"] if "place_kind" in row.keys() else None
        return slugify(kind or "other", fallback="other")
    if table == "artists":
        genre = row["genre"] if "genre" in row.keys() else None
        return slugify(genre or "unknown-genre", fallback="unknown-genre")
    return None


def _entity_name(row: sqlite3.Row) -> str:
    keys = row.keys()
    if "name" in keys and row["name"]:
        return row["name"]
    if "title" in keys and row["title"]:
        return row["title"]
    return "Unknown"


def _entity_date_prefix(row: sqlite3.Row, table: str) -> str:
    if table == "events" and "start_datetime" in row.keys() and row["start_datetime"]:
        text = row["start_datetime"].strip()
        if len(text) >= 10 and text[4] == "-":
            return text[:10]
    if table == "deals" and "valid_until" in row.keys() and row["valid_until"]:
        text = row["valid_until"].strip()
        if len(text) >= 10 and text[4] == "-":
            return text[:10]
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _clean_display_name(raw: str | None, *, fallback: str = "Untitled") -> str:
    """Sanitize a human-readable title for H1 and front matter."""
    text = (raw or "").strip()
    for pattern in _TITLE_NOISE_PATTERNS:
        text = pattern.sub("", text)
    text = re.sub(r"\s+", " ", text).strip(" |")
    if not text:
        text = fallback
    if len(text) > MAX_DISPLAY_NAME_LEN:
        text = text[: MAX_DISPLAY_NAME_LEN - 1].rstrip() + "…"
    return text


def _short_external_id(source_provider: str, external_id: str, name: str) -> str:
    """Stable short id for filenames — never use full URLs or long deal titles."""
    ext = (external_id or "").strip()
    provider = (source_provider or "").lower()

    if provider == "google_places":
        return ext or slugify(name, fallback="place")[:MAX_SLUG_FILENAME_LEN]

    if provider == "bandsintown":
        match = re.search(r"/e-(\d+)", ext) or re.search(r"e-(\d+)", ext)
        if match:
            return match.group(1)
        digits = re.search(r"(\d{6,})", ext)
        if digits:
            return digits.group(1)

    if provider in {"quicket", "howler"}:
        if ext.isdigit():
            return ext
        digits = re.search(r"(\d{4,})", ext)
        if digits:
            return digits.group(1)
        safe_id = re.sub(r"[^\w.-]", "-", ext)
        if safe_id:
            return safe_id[:MAX_SLUG_FILENAME_LEN].strip("-")

    if provider in {"fomosa", "hyperli"}:
        return slugify(ext or name, fallback="deal")[:MAX_SLUG_FILENAME_LEN]

    safe_id = re.sub(r"[^\w.-]", "-", ext)
    if safe_id:
        return safe_id[:MAX_SLUG_FILENAME_LEN].strip("-")
    return slugify(name, fallback="item")[:MAX_SLUG_FILENAME_LEN]


def entity_filename(table: str, row: sqlite3.Row) -> str:
    """Stable short filename — one note per source+external_id."""
    name = _entity_name(row)
    short_id = _short_external_id(row["source_provider"], str(row["source_external_id"]), name)
    return f"{row['source_provider']}-{short_id}.md"


def _format_yaml_tags(*tags: str) -> str:
    lines = ["tags:"]
    for tag in tags:
        lines.append(f"  - {tag}")
    return "\n".join(lines)


def _assert_note_path_length(note_path: Path) -> None:
    path_len = len(str(note_path.resolve()))
    if path_len > MAX_NOTE_PATH_LEN:
        raise ValueError(
            f"Note path too long ({path_len} > {MAX_NOTE_PATH_LEN}): {note_path.name}"
        )


def _city_display_name(city_slug: str) -> str:
    cities = load_cities()
    entry = cities.get(city_slug)
    if entry and entry.get("name"):
        return entry["name"]
    return city_slug.replace("-", " ").title()


def folder_name_for_entity(entity_type: str) -> str:
    mapping = {"event": "events", "place": "places", "artist": "artists", "deal": "deals"}
    return mapping.get(entity_type, f"{entity_type}s")


def _callout(status: str) -> str:
    mapping = {
        "pending": "> [!warning] Vetting: pending",
        "approved": "> [!success] Vetting: approved",
        "rejected": "> [!failure] Vetting: rejected",
    }
    return mapping.get(status, f"> [!note] Vetting: {status}")


def _row_value(row: sqlite3.Row, key: str) -> str | None:
    if key not in row.keys():
        return None
    value = row[key]
    if value is None or value == "":
        return None
    return str(value)


def _build_key_details(table: str, row: sqlite3.Row) -> list[str]:
    lines: list[str] = []
    if table == "events":
        for label, key in (
            ("When", "start_datetime"),
            ("Ends", "end_datetime"),
            ("Location", "location"),
            ("Ticketing", "external_ticketing_url"),
        ):
            value = _row_value(row, key)
            if value:
                if key == "external_ticketing_url":
                    lines.append(f"- **{label}:** [{value}]({value})")
                else:
                    lines.append(f"- **{label}:** {value}")
    elif table == "places":
        for label, key in (
            ("Address", "address"),
            ("Kind", "place_kind"),
            ("Phone", "phone"),
            ("Website", "website"),
            ("Maps", "google_maps_url"),
        ):
            value = _row_value(row, key)
            if value:
                if key in ("website", "google_maps_url"):
                    lines.append(f"- **{label}:** [{value}]({value})")
                else:
                    lines.append(f"- **{label}:** {value}")
    elif table == "artists":
        for label, key in (("Genre", "genre"), ("Bio", "bio")):
            value = _row_value(row, key)
            if value:
                lines.append(f"- **{label}:** {value}")
    elif table == "deals":
        for label, key in (
            ("Merchant", "merchant_name"),
            ("Valid until", "valid_until"),
            ("Deal URL", "deal_url"),
        ):
            value = _row_value(row, key)
            if value:
                if key == "deal_url":
                    lines.append(f"- **{label}:** [{value}]({value})")
                else:
                    lines.append(f"- **{label}:** {value}")
        price = row["price_cents"] if "price_cents" in row.keys() else None
        if price is not None:
            currency = row["currency"] if "currency" in row.keys() else "ZAR"
            lines.append(f"- **Price:** {price / 100:.2f} {currency}")

    description = _row_value(row, "description")
    if description:
        snippet = description if len(description) <= 400 else description[:397] + "..."
        lines.append(f"- **Description:** {snippet}")

    image = _row_value(row, "image_url")
    if image:
        lines.append(f"- **Image:** [{image}]({image})")

    return lines


def _fetch_source_links(conn: sqlite3.Connection, entity_type: str, entity_id: int) -> list[str]:
    rows = conn.execute(
        """
        SELECT url FROM source_links
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY url
        """,
        (entity_type, entity_id),
    ).fetchall()
    return [row["url"] for row in rows]


def _render_entity(
    conn: sqlite3.Connection,
    table: str,
    entity_type: str,
    row: sqlite3.Row,
) -> str:
    template_path = TEMPLATE_DIR / "entity.md"
    template = template_path.read_text(encoding="utf-8") if template_path.exists() else (
        "---\nentity_type: {{entity_type}}\nsource: {{source_provider}}\n"
        "city: {{city_slug}}\nvetting_status: {{vetting_status}}\n---\n\n"
        "# {{name}}\n\n{{callout}}\n\n{{key_details}}\n\n{{links_section}}\n"
    )
    raw_name = _entity_name(row)
    display_name = _clean_display_name(raw_name, fallback=str(row["source_external_id"]))
    now = datetime.now(timezone.utc)
    city_index_stem = _city_index_stem(row["city_slug"])
    last_scraped = _row_value(row, "last_scraped_at") or "unknown"

    key_details_lines = _build_key_details(table, row)
    if key_details_lines:
        detail_lines = ["> [!info] Key details", ""]
        for line in key_details_lines:
            detail_lines.append("> " + line[2:] if line.startswith("- ") else "> " + line)
        key_details = "\n".join(detail_lines)
    else:
        key_details = "> [!info] Key details\n> _(no extra fields scraped yet)_"

    catalog_entry = "\n".join(
        [
            "> [!info] Catalog entry",
            f"> **City:** {row['city_slug']}",
            f"> **Source:** {row['source_provider']}",
            f"> **External ID:** `{row['source_external_id']}`",
            f"> **Last scraped:** {last_scraped}",
            f"> **Dedup key:** `{row['source_external_id']}`",
        ]
    )

    links = _fetch_source_links(conn, entity_type, row["id"])
    if links:
        links_section = "## Links\n\n" + "\n".join(f"- [Listing]({url})" for url in links)
    else:
        links_section = "## Links\n\n_(none recorded)_"

    related_section = "\n".join(
        [
            "## Related",
            "",
            f"- [[{city_index_stem}|City dashboard]]",
            f"- [[{row['city_slug']}/{folder_name_for_entity(entity_type)}/{row['source_provider']}/_index|{row['source_provider']} index]]",
        ]
    )

    tags = _format_yaml_tags(
        "discovery-catalog",
        row["city_slug"],
        row["source_provider"],
        entity_type,
    )
    replacements = {
        "{{entity_type}}": entity_type,
        "{{source_provider}}": row["source_provider"],
        "{{source_external_id}}": row["source_external_id"],
        "{{city_slug}}": row["city_slug"],
        "{{vetting_status}}": row["vetting_status"],
        "{{display_name}}": display_name,
        "{{name}}": display_name,
        "{{callout}}": _callout(row["vetting_status"]),
        "{{catalog_entry}}": catalog_entry,
        "{{exported_at}}": now.isoformat().replace("+00:00", "Z"),
        "{{date}}": now.strftime("%Y-%m-%d"),
        "{{time}}": now.strftime("%H:%M"),
        "{{tags}}": tags,
        "{{key_details}}": key_details,
        "{{links_section}}": links_section,
        "{{related_section}}": related_section,
    }
    content = template
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


def _render_city_index(
    city_slug: str,
    *,
    counts_by_type: dict[str, int],
    counts_by_source: dict[str, dict[str, int]],
    total: int,
    exported_at: datetime,
) -> str:
    template_path = TEMPLATE_DIR / "run_summary.md"
    template = template_path.read_text(encoding="utf-8") if template_path.exists() else (
        "---\ndate: {{date}}\ntime: {{time}}\nsource: discovery-ingestion\n"
        "city: {{city_slug}}\ntags: [discovery-catalog, {{city_slug}}]\n---\n\n"
        "# Discovery Catalog — {{city_display_name}}\n\n{{info_callout}}\n\n"
        "## By entity type\n\n{{by_type}}\n\n## By source\n\n{{by_source}}\n\n"
        "## Next steps\n\n{{next_steps}}\n"
    )
    city_name = _city_display_name(city_slug)
    db_path = get_db_path()
    info_callout = "\n".join(
        [
            "> [!info] Export Summary",
            f"> **Total entities:** {total}",
            f"> **Exported at:** {exported_at.strftime('%Y-%m-%d %H:%M UTC')}",
            f"> **Database:** `{db_path}`",
        ]
    )
    by_type_lines = []
    for folder in ("events", "places", "artists", "deals"):
        count = counts_by_type.get(folder, 0)
        if count:
            by_type_lines.append(f"- **{folder}/** — {count}")
    by_type = "\n".join(by_type_lines) if by_type_lines else "- _(no entities)_"

    by_source_lines = []
    for source in sorted(counts_by_source):
        parts = counts_by_source[source]
        detail = ", ".join(f"{count} {etype}" for etype, count in sorted(parts.items()) if count)
        links = []
        for etype, count in sorted(parts.items()):
            if count:
                links.append(f"[{etype}]({etype}/{source}/_index.md)")
        link_text = " · ".join(links) if links else ""
        line = f"- **{source}** — {detail}"
        if link_text:
            line += f" ({link_text})"
        by_source_lines.append(line)
    by_source = "\n".join(by_source_lines) if by_source_lines else "- _(no entities)_"

    next_steps = "\n".join(
        [
            "- [ ] Review pending callouts in entity notes",
            "- [ ] Run entity resolve for artists/places",
            "- [ ] Approve entities for Phase 2 Convex promotion",
            "- [ ] See [[agents/QUICK-START|Agent quick start]] for scrape and export rules",
        ]
    )

    tags_block = _format_yaml_tags("discovery-catalog", city_slug)

    replacements = {
        "{{date}}": exported_at.strftime("%Y-%m-%d"),
        "{{time}}": exported_at.strftime("%H:%M"),
        "{{city_slug}}": city_slug,
        "{{city_display_name}}": city_name,
        "{{count}}": str(total),
        "{{exported_at}}": exported_at.isoformat().replace("+00:00", "Z"),
        "{{info_callout}}": info_callout,
        "{{by_type}}": by_type,
        "{{by_source}}": by_source,
        "{{next_steps}}": next_steps,
        "{{tags}}": tags_block,
    }
    content = template
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


def _render_source_index(
    city_slug: str,
    entity_folder: str,
    source_provider: str,
    rows: list[sqlite3.Row],
    *,
    subfolder_counts: dict[str, int],
    recent_notes: list[tuple[str, str]],
    exported_at: datetime,
    city_index_name: str,
) -> str:
    total = len(rows)
    lines = [
        "---",
        f"date: {exported_at.strftime('%Y-%m-%d')}",
        f"time: {exported_at.strftime('%H:%M')}",
        "source: discovery-ingestion",
        f"city: {city_slug}",
        f"entity_type: {entity_folder.rstrip('s')}",
        f"source_provider: {source_provider}",
        _format_yaml_tags("discovery-catalog", city_slug, source_provider),
        "---",
        "",
        f"# {source_provider} — {_city_display_name(city_slug)} {entity_folder}",
        "",
        "> [!info] Source index",
        f"> **Entities:** {total}",
        f"> **Exported at:** {exported_at.strftime('%Y-%m-%d %H:%M UTC')}",
        f"> **City index:** [[{city_index_name}]]",
        "",
    ]
    if subfolder_counts:
        lines.extend(["## By subfolder", ""])
        for subfolder, count in sorted(subfolder_counts.items()):
            lines.append(f"- **{subfolder}/** — {count}")
        lines.append("")
    if recent_notes:
        lines.extend(["## Recent", ""])
        for note_stem, label in recent_notes[:10]:
            lines.append(f"- [[{note_stem}|{label}]]")
        lines.append("")
    return "\n".join(lines)


def discover_cities(conn: sqlite3.Connection) -> list[str]:
    slugs: set[str] = set()
    for table, _, _ in ENTITY_TABLES:
        for row in conn.execute(f"SELECT DISTINCT city_slug FROM {table}").fetchall():
            slugs.add(row["city_slug"])
    if not slugs:
        slugs = set(load_cities().keys())
    return sorted(slugs)


def _reconcile_source_notes(source_dir: Path, written_paths: set[Path]) -> None:
    """Remove stale entity notes when DB rows move city or are deleted."""
    if not source_dir.is_dir():
        return
    for path in source_dir.rglob("*.md"):
        if path.name == "_index.md":
            continue
        if path.resolve() not in written_paths:
            path.unlink(missing_ok=True)


def _city_index_stem(city_slug: str) -> str:
    return f"Discovery-Catalog-{_city_display_name(city_slug).replace(' ', '-')}"


def _cleanup_old_city_indexes(city_dir: Path, city_index_path: Path) -> None:
    for old in city_dir.glob("*Discovery-Catalog*.md"):
        if old.resolve() != city_index_path.resolve():
            old.unlink(missing_ok=True)


def _reconcile_catalog_entity_notes(written_paths: set[Path]) -> None:
    """Remove entity notes not in the current export (cross-city moves, renames)."""
    parts = [p for p in DISCOVERY_CATALOG_FOLDER.split("/") if p]
    catalog = vault_root().joinpath(*parts)
    if not catalog.is_dir():
        return
    for path in catalog.rglob("*.md"):
        if path.name == "_index.md":
            continue
        if path.name.startswith("Discovery-Catalog-"):
            continue
        if path.resolve() not in written_paths:
            path.unlink(missing_ok=True)


def export_city(
    conn: sqlite3.Connection,
    city_slug: str,
    *,
    written_paths: set[Path] | None = None,
) -> Path:
    city_dir = resolve_city_dir(city_slug)
    exported_at = datetime.now(timezone.utc)
    city_index_stem = _city_index_stem(city_slug)
    all_written = written_paths if written_paths is not None else set()

    counts_by_type: dict[str, int] = defaultdict(int)
    counts_by_source: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    source_rows: dict[tuple[str, str], list[sqlite3.Row]] = defaultdict(list)
    source_subfolders: dict[tuple[str, str], dict[str, int]] = defaultdict(lambda: defaultdict(int))
    source_recent: dict[tuple[str, str], list[tuple[str, str, str | None]]] = defaultdict(list)

    total = 0

    for table, entity_type, folder in ENTITY_TABLES:
        name_col = "title" if table == "deals" else "name"
        rows = conn.execute(
            f"SELECT * FROM {table} WHERE city_slug = ? ORDER BY {name_col}",
            (city_slug,),
        ).fetchall()
        for row in rows:
            total += 1
            counts_by_type[folder] += 1
            counts_by_source[row["source_provider"]][folder] += 1

            subfolder = entity_subfolder(table, row)
            entity_dir = resolve_entity_dir(city_slug, folder, row["source_provider"], subfolder)
            filename = entity_filename(table, row)
            note_path = entity_dir / filename
            _assert_note_path_length(note_path)
            note_path.write_text(
                _render_entity(conn, table, entity_type, row),
                encoding="utf-8",
            )
            all_written.add(note_path.resolve())

            key = (folder, row["source_provider"])
            source_rows[key].append(row)
            if subfolder:
                source_subfolders[key][subfolder] += 1

            last_scraped = _row_value(row, "last_scraped_at")
            note_stem = note_path.stem
            source_recent[key].append((last_scraped or "", note_stem, _entity_name(row)))

    for (folder, source_provider), rows in source_rows.items():
        subfolder_counts = dict(source_subfolders[(folder, source_provider)])
        recent_sorted = sorted(
            source_recent[(folder, source_provider)],
            key=lambda item: item[0],
            reverse=True,
        )
        recent_notes = [(stem, name) for _, stem, name in recent_sorted if name]
        source_dir = resolve_entity_dir(city_slug, folder, source_provider)
        index_path = source_dir / "_index.md"
        index_path.write_text(
            _render_source_index(
                city_slug,
                folder,
                source_provider,
                rows,
                subfolder_counts=subfolder_counts,
                recent_notes=recent_notes,
                exported_at=exported_at,
                city_index_name=city_index_stem,
            ),
            encoding="utf-8",
        )
        _reconcile_source_notes(source_dir, all_written)

    city_index_path = city_dir / f"{city_index_stem}.md"
    _cleanup_old_city_indexes(city_dir, city_index_path)
    city_index_path.write_text(
        _render_city_index(
            city_slug,
            counts_by_type=dict(counts_by_type),
            counts_by_source={
                source: dict(parts) for source, parts in counts_by_source.items()
            },
            total=total,
            exported_at=exported_at,
        ),
        encoding="utf-8",
    )

    return city_dir


def export_all_cities(conn: sqlite3.Connection) -> list[Path]:
    written: set[Path] = set()
    paths = [export_city(conn, city_slug, written_paths=written) for city_slug in discover_cities(conn)]
    _reconcile_catalog_entity_notes(written)
    return paths
