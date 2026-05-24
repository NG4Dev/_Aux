# Quicket recon

## Overview

Primary SA ticketing platform. Public event catalog exposed via **Algolia** client-side search.

## API

| Item | Value |
|------|-------|
| App ID | `QAUIPDMSEL` |
| Index | `products` |
| Endpoint | `POST https://qauipdmsel-dsn.algolia.net/1/indexes/products/query` |
| Auth | Public search-only API key embedded in frontend JS bundle |

### Sample request

```json
{
  "query": "",
  "filters": "city:'Johannesburg'",
  "hitsPerPage": 50,
  "page": 0
}
```

Headers: `X-Algolia-Application-Id`, `X-Algolia-API-Key`

## Key fields (hits)

- `objectID`, `name`, `slug`, `startDate`, `venue` / `venueName`
- `description`, `image`, `url`
- Category tags for discover mapping

## Anti-bot

- Algolia POST is low-friction when using the public search key
- No Playwright required for listing scrape
- Rate-limit politely (~1 req/s)

## Notes

- Extract search key from `quicket.co.za` network tab or main bundle
- City filter uses display name (`Johannesburg`, not slug)
