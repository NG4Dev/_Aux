# Howler recon

## Overview

Independent music/event ticketing (howler.co.za). Public **active events** catalog is backed by **Algolia**, not the empty `/events` listing page.

## Live API (preferred)

| Item | Value |
|------|-------|
| Page | `https://www.howler.co.za/active` |
| Config | `window.APP_CONFIG.algolia` embedded in HTML |
| App ID | `K4FPULVWDS` |
| Index | `Event` |
| Endpoint | `POST https://k4fpulvds-dsn.algolia.net/1/indexes/Event/query` |

Credentials are auto-fetched from `/active` (override via `HOWLER_ALGOLIA_APP_ID` / `HOWLER_ALGOLIA_API_KEY`).

### City scoping

Algolia has no reliable `venue.city` facet. Scraper uses:

1. `query: "{City Name}"` (e.g. `Johannesburg`)
2. Post-filter: event `name`, `venue.address`, or `tags` contains city name

Approximate hit counts (May 2026): JHB ~60, CPT ~20, DBN ~24, PTA ~18.

### Key fields (hits)

- `objectID`, `slug`, `name`
- `start_time`, `end_time`
- `venue.name`, `venue.address`
- `organiser.name`
- `header_image`, `og_url`
- `tags`, `primary_category_name`

Event URL: `https://www.howler.co.za/events/{slug}` (fallback: `og_url`).

## Legacy / misleading URLs

- `https://howler.co.za/events` — often shows **0 Events** (organiser portal shell)
- Use **`www.howler.co.za/active`** for consumer listings

## Anti-bot

- Algolia search-only key is public in frontend config
- Rate-limit ~2–5 req/s when paginating

## Notes

- Strong source for JHB/CT live music and festivals
- `listing_signals` + organiser names useful for outreach
- Playwright only needed if Algolia access is revoked
