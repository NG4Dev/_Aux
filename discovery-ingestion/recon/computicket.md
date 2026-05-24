# Computicket recon

## Overview

Ticketpro/Computicket — largest SA event catalog. ASP.NET listing pages + detail pages.

## URLs

- List: `https://www.computicket.com/events/`
- Detail: `/events/{slug}`

## Selectors (initial)

| Element | Selector |
|---------|----------|
| Event card | `.event-card`, `[data-event-id]` |
| Title | `h2.event-title`, `.event-name` |
| Date | `.event-date` |
| Venue | `.venue-name` |
| Link | `a.event-link` |

## Data shape

- Event ID in `data-event-id` or URL slug
- ISO-ish date strings; confirm timezone (SAST)
- Price from `.price-from`

## Anti-bot

- Cloudflare on aggressive requests
- Use Playwright with realistic UA
- `--pause-on-captcha` for manual solve in headed mode
- Prefer caching list HTML during recon

## API notes

- No public JSON API observed; DOM scrape primary path
- Artist/lineup often on detail page only — second pass scrape
