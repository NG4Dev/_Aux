# AirDosh recon

## Overview

SA event platform with organizer-centric listings (airdosh.co.za).

## URLs

- List: `https://www.airdosh.co.za/events`
- Detail: `/events/{id}`

## Selectors

| Element | Selector |
|---------|----------|
| Card | `.event-card` |
| Title | `h2` |
| Date | `.date` |
| Organizer | `.organizer` |

## Rich fields

- Organizer name/email/social — populate `organizers` table
- `sameAs` links for verification

## Anti-bot

- Moderate; standard Playwright sufficient
- Check for lazy-loaded infinite scroll

## Notes

- Priority source for `listing_signals` + organizer outreach prefill
