# Webtickets recon

## Overview

Legacy ASP.NET ticketing platform (webtickets.co.za).

## URLs

- List: `https://www.webtickets.co.za/v2/Event.aspx`
- City filters via query params (confirm during recon)

## Selectors

| Element | Selector |
|---------|----------|
| Row | `tr.event-row`, `.event-listing` |
| Title | `.event-title` |
| Date | `.event-date` |
| Venue | `.venue` |

## Anti-bot

- Session cookies required; use Playwright persistent context
- ViewState/postback — avoid raw httpx for listing pages
- Slow page loads; increase timeout to 60s

## Notes

- Table-based markup; stable class names
- Detail pages contain ticket tiers — future `catalog_items` capture
