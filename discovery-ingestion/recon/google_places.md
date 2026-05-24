# Google Places recon

## Overview

Venue/merchant discovery via Places API (Text Search + Place Details).

## API

| Step | Endpoint |
|------|----------|
| Search | `GET maps.googleapis.com/maps/api/place/textsearch/json` |
| Details | `GET maps.googleapis.com/maps/api/place/details/json` |

Env: `GOOGLE_PLACES_API_KEY`

### Search query pattern

```
restaurants bars cafes {city}, South Africa
```

### Details fields (generous capture)

```
name,formatted_address,geometry,website,url,formatted_phone_number,
opening_hours,photos,types,editorial_summary,rating,user_ratings_total
```

## Storage

- Full Details JSON → `places.google_raw_json`
- Photo references → `photo_urls_json` (Places Photo API URLs)
- `website` → trigger `menu_web` scraper

## Anti-bot / billing

- API key restrictions by IP/referrer
- Text Search + Details billed per request — batch and cache
- Store raw JSON for Phase 2 audit

## Notes

- `menu_listing_url` often equals website `/menu` path
- Map `types` → `discoverCategorySlugs` via `discover_mapping.yaml`
