# Fomosa recon

## Overview

Experience/deal marketplace (fomosa.co.za) — map to SQLite `deals` table.

## URLs

- List: `https://www.fomosa.co.za/experiences`
- City filter TBD during recon

## Selectors

| Element | Selector |
|---------|----------|
| Card | `.experience-card`, `.deal-item` |
| Title | `h3` |
| Price | `.price` |
| Link | `a` |

## Data shape

- Price in ZAR (convert to cents)
- Merchant/venue name on detail page
- Valid-until dates for deal expiry

## Anti-bot

- Standard scraping; no heavy protection observed
- Images hotlinked — store URLs in vetting phase

## Notes

- Phase 2 maps approved deals → `products` with `productKind: deal`
