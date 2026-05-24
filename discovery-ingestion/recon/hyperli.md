# Hyperli recon

## Overview

Daily deals platform (hyperli.com) — city-scoped deal pages.

## URLs

- JHB: `https://www.hyperli.com/deals/johannesburg`
- CPT: `https://www.hyperli.com/deals/cape-town`

## Selectors

| Element | Selector |
|---------|----------|
| Card | `.deal-card`, `article` |
| Title | `h2`, `h3` |
| Price | `.deal-price` |
| Link | `a.deal-link` |

## Data shape

- Discount price + merchant name
- Deal URL stable slug
- Expiry countdown on card

## Anti-bot

- Cloudflare on some paths; Playwright recommended
- Pagination via "load more" button

## Notes

- SQLite `deals` not `events`
- Cross-reference merchant with Google Places during vetting
