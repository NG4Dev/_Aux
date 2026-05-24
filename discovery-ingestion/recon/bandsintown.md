# BandsInTown recon

## Overview

Global artist-centric event aggregator. SA city pages list local shows.

## URLs

- City: `https://www.bandsintown.com/c/{city-slug}/all-dates/genre/all-genres`
- Example: `johannesburg-south-africa`

## Data extraction

**Primary:** `application/ld+json` blocks with `@type: MusicEvent`

### MusicEvent fields

- `name`, `startDate`, `url`, `description`, `image`
- `location.name` (venue)
- `performer[]` with `name`, `sameAs`, `genre`

## Selectors (fallback)

| Element | Selector |
|---------|----------|
| Card | `[data-testid='event-card']`, `.event-card` |
| Artist | `.artist-name` |
| Venue | `.venue-name` |
| Date | `time` |

## Anti-bot

- JSON-LD often sufficient without browser
- Full page may require JS for complete list — Playwright fallback
- Respect robots; cache HTML

## Notes

- Best Phase 1 source for `artists` + `event_performers`
- `rsvpCount` / interest metrics on cards — trend signals
