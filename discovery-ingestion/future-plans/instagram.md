# Instagram scraper (Phase 3+)

## Status

**Deferred** — see `domain_model_decisions.md` §10.

## Rationale

- High anti-bot / ToS risk
- Unstructured event data (stories, captions)
- Manual CAPTCHA and account rotation overhead

## Planned approach

1. Business account API where organizers opt in
2. Hashtag/location monitoring only after legal review
3. Human-in-loop vetting mandatory

## Prerequisites

- Stable Convex promotion pipeline (Phase 2)
- Organizer claim flow for verified listings
- Separate recon doc after API access decision
