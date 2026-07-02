# AUX Monorepo — Agent Guide

Short tracked context for Cursor agents. Verbose notes, recon, and session docs stay in each project’s `.local/` folder (gitignored).

## Commit policy

- **Mobile app (`user-business-mobile/MobileApp/`)** — commit **code only**: `.ts`, `.tsx`, config (`app.json`, `metro.config.js`, `package.json`), and runnable scripts. Do **not** commit `docs/*.md` (except `docs/README.md`), `logs/`, `.expo-tmp-check/`, or anything under `.local/`.
- **Discovery ingestion** — commit pipeline **source** (`src/`, `scripts/`, tests, `.env.example`). Do **not** commit `agent-docs/`, `recon/`, or `.local/`.
- **Never commit** secrets (`.env`), session logs, or agent-generated markdown snapshots.

## Discovery ingestion

**Path:** `discovery-ingestion/`

**Today:** CLI pipeline that scrapes sources (Google Places, etc.) into a local SQLite catalog, exports Obsidian notes, and feeds merchant/product data into Convex seed scripts for the mobile discover feed.

**Local docs:** `discovery-ingestion/.local/agent-docs/` (templates, dated feature write-ups) and `discovery-ingestion/.local/recon/` (source recon notes).

**Future — Master Portal UI (not built yet):**

- Move ingestion control into the web admin / master portal.
- Operator runs ingestion from the UI, sees “places we don’t have yet,” and adds merchants through the portal instead of manual seed/CLI only.
- Discovery-ingestion Python pipeline remains the backend worker; portal becomes the operator surface.

## Mobile — Discover Product Overlay

**Local spec:** `user-business-mobile/MobileApp/.local/docs/product-detail-media-layout.md`

**Current behavior:**

- **Product tab** — sheet moves by clip only; no internal content transforms on swipe (static sheet content).
- **Menu tab** — hero carousel + queue list (YouTube Music pattern in progress).

**Next planned work:** YT Music-style menu tab — fixed carousel height, inline mini-player at peek, header mini-player on expand, menu category chips from product `categoryId` (Tapas / Mains / Drinks), not merchant discover categories.

## Verification route

Discover → Beach bars → La Parada (test merchant: `la-parada`, product: `patatas-bravas`).

Device QA logs: `user-business-mobile/MobileApp/logs/dev-session-latest.log` (gitignored).

```powershell
Select-String -Path user-business-mobile/MobileApp/logs/dev-session-latest.log -Pattern "\[DiscoverFlow\]"
```
