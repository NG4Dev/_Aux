# Fever recon

## Overview

Experience marketplace (feverup.com) — city-scoped plans/experiences.

## URLs

- JHB: `https://feverup.com/en/johannesburg`
- CPT: `https://feverup.com/en/cape-town`

## Selectors

| Element | Selector |
|---------|----------|
| Card | `[data-testid='planning-card']`, `.card` |
| Title | `h3` |
| Date | `.date` |
| Link | `a` |

## API

- Next.js `__NEXT_DATA__` may contain plan JSON — inspect during recon
- GraphQL endpoint possible in network tab

## Anti-bot

- Geo/city routing; set locale headers
- Rate limit; Fever uses CDN caching

## Notes

- Map to `events` with `date_precision` when times unknown
- Experience deals overlap with `deals` — classify in vetting
