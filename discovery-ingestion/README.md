# Discovery Ingestion (Phase 1)

Local Python pipeline for scraping SA event/place/deal catalogs into SQLite, human vetting in Obsidian, and calendar/trend aggregation. **No Convex writes in Phase 1.**

## Setup

```bash
cd discovery-ingestion
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
playwright install chromium     # optional, for DOM scrapers
copy .env.example .env
```

## CLI

```bash
# Single source with Rich progress + skip/dedupe
python -m src.main scrape --city johannesburg --source quicket

# All 11 sources in build order (Johannesburg first, then expand metros)
python -m src.main scrape --city johannesburg --all-sources

# Force re-scrape even when content hash unchanged
python -m src.main scrape --city johannesburg --all-sources --force

# Machine-readable output (no Rich UI)
python -m src.main scrape --city johannesburg --source quicket --json

python -m src.main export-obsidian --city cape-town
python -m src.main vet list --status pending
python -m src.main calendar build --city all --months 3
python -m src.main calendar export-obsidian --city johannesburg
python -m src.main resolve --entity-type artist
python -m src.main report
python -m src.main report --city johannesburg
```

Scrape output includes per-item progress (`inserted`, `updated`, `skipped (fresh)`), region completion %, table deltas, and writes `output/latest_run.json`. Sources not yet implemented report `not wired` and insert **no** fake catalog rows. Exit code `1` only when a source hard-fails (warnings/empty stubs exit `0`).

## Sources

| Source | Type | Status |
|--------|------|--------|
| quicket | Algolia API | **Live** — ~273 JHB events |
| howler | Algolia Event index | **Live** — ~60 JHB events |
| airdosh | tickets.airdosh.co.za | **Live** — Playwright list + detail parse |
| fomosa | HTML deals | **Live** — fomosa.co.za/experiences |
| hyperli | HTML deals | **Live** — hyperli.com/collections/all (city filter in title) |
| fever | Playwright + HTML | **Live** — feverup.com/en/{city}/music-events |
| bandsintown | Playwright JSON-LD | **Live** when JSON-LD present |
| google_places | Places API | Live when `GOOGLE_PLACES_API_KEY` set |
| computicket, webtickets | Playwright | Not wired yet |

## Output

- SQLite: `data/discovery.db` (schema mirrors Convex domain)
- Obsidian: `{OBSIDIAN_VAULT_PATH}/business/discovery-catalog/{city}/` (defaults to `C:\Users\User\Desktop\Mission Control`)
- Recon docs: `recon/*.md` (read before extending scrapers)

### Obsidian folder layout

Each scrape auto-exports to the Mission Control vault (use `--no-obsidian-export` to skip):

```text
business/discovery-catalog/johannesburg/
  2026-05-23_Discovery-Catalog-Johannesburg.md   ← city dashboard (counts only)
  events/quicket/2026-06/{date}_{slug}.md
  events/quicket/_index.md
  places/google_places/venue/{date}_{slug}.md
  artists/bandsintown/rock/{date}_{slug}.md
  deals/hyperli/{date}_{slug}.md
```

Manual export: `python -m src.main export-obsidian --city all`

## Workflow

1. **Recon** — read/update `recon/{source}.md`
2. **Scrape** — populate SQLite with `vetting_status=pending`
3. **Vet** — review Obsidian notes with callouts
4. **Resolve** — dedupe cross-platform entities
5. **Calendar** — build month/week aggregates + trends
6. **Phase 2** — promote approved rows to Convex (future)

See [`domain_model_decisions.md`](../domain_model_decisions.md) §13–§15 for domain mapping rules.
