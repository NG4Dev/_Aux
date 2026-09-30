# AUX Monorepo — Agent Guide

Short tracked context for Cursor agents. Verbose notes, recon, and session docs stay in each project’s `.local/` folder (gitignored).

## Commit policy

- **Mobile app (`user-business-mobile/MobileApp/`)** — commit **code only**: `.ts`, `.tsx`, config (`app.json`, `metro.config.js`, `package.json`, `eas.json`), and runnable scripts under `scripts/`. Do **not** commit `docs/*.md` (except `docs/README.md`), `logs/`, `.expo-tmp-check/`, or anything under `.local/`.
- **Discovery ingestion** — commit pipeline **source** (`src/`, `scripts/`, tests, `.env.example`). Do **not** commit `agent-docs/`, `recon/`, or `.local/`.
- **Never commit** secrets (`.env`), session logs, or agent-generated markdown snapshots.

### Mobile — do NOT commit native folders

`ios/` and `android/` are **gitignored** (same pattern as Complete Farmer). EAS runs `expo prebuild` on build workers — native projects are generated at build time, not stored in git.

| Do commit | Do not commit |
|-----------|----------------|
| `app.json`, `eas.json`, `package.json` | `ios/` (entire tree) |
| `src/**`, Convex client wiring | `android/` (entire tree) |
| `scripts/*.ps1`, `scripts/HANDOFF-IOS.md` | `google-services.json`, `GoogleService-Info.plist` (real Firebase files) |
| `.env.example`, `*.example` plist/json | `Podfile.lock` under a tracked ios tree |
| Analytics, assistant, funnel `.ts`/`.tsx` | Anything under `.local/`, `logs/` |
| `app.config.js` (conditional Firebase) | Real `google-services.json` / `GoogleService-Info.plist` in git |

**Firebase on EAS:** Config files stay gitignored. Upload them as EAS **file** environment variables (or place locally for Mac/Windows prebuild). `app.config.js` enables `@react-native-firebase/*` only when those files exist — preview Android builds must not require them in git.

**Windows reserved name:** App display name is `"Aux"`. A committed prebuild folder `ios/Aux/` breaks `git pull` on Windows (`Aux` is a reserved device name). **Never commit `ios/` or `android/`** — EAS prebuild runs on Mac/Linux workers where `ios/Aux/` is fine. Do not rename slug unless you also update the linked EAS project on expo.dev.

### Mobile — role split (build ownership)

| Who | Machine | Owns |
|-----|---------|------|
| Owner (NG4Dev) | Windows | JS/TS, Convex, web analytics, mobile analytics wiring, **Android EAS** (`preview` APK), Expo `@ng4corp/aux` secrets |
| Rishay | Mac | **iOS TestFlight** — Path A default (local Xcode Archive); Path B optional after Expo invite (`eas build` / `eas submit` `preview-testflight`) |

**Owner (Windows):**

```powershell
cd user-business-mobile/MobileApp
eas build --profile preview --platform android
```

**iOS helper (Mac only)** — full runbook: `user-business-mobile/MobileApp/scripts/HANDOFF-IOS.md`

Path A (default — local → TestFlight):

```bash
npx expo prebuild --platform ios --clean
# Xcode Archive → App Store Connect / TestFlight — never commit ios/
```

Path B (optional — EAS iOS after invite to `@ng4corp`; project `@ng4corp/aux`):

```bash
eas build --profile preview-testflight --platform ios
eas submit --profile preview-testflight --platform ios --latest
```

Do not ask Windows agents to commit `ios/`, or merge branches that require checking out `ios/Aux/` locally. Merge on GitHub or on Mac. Local `ios/` on Mac disk is fine; never push it.

**Collaborator Cursor setup** — install Expo/Clerk/Stripe/Convex skill packs and Chrome DevTools MCP with `--autoConnect` (live Chrome, not headless) so agents match the owner. Full commands: `user-business-mobile/MobileApp/scripts/HANDOFF-IOS.md`.

**Bundle IDs (do not change without coordination):**

- iOS: `com.galyvant.aux` (team `VNG3LN323R`)
- Android: `com.ng4.RNAuth`
- Expo: owner `ng4corp`, slug `aux`, projectId `3db21201-d159-475f-9a0c-82ca1b345f5c` — do not rename without updating the EAS project on expo.dev

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
