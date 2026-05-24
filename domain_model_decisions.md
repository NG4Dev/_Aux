# Domain Model Decisions (Convex)

**Source of truth for database/domain design.** Consult before schema changes, onboarding flows, or admin persona work. UI flows live in [`mobile_commerce_flow.md`](mobile_commerce_flow.md).

**Schema:** [`user-business-web/convex/schema.ts`](user-business-web/convex/schema.ts)

---

## 1. Purpose & how to use

- Read this doc before adding tables, fields, or indexes.
- Update the **Decision log** (§11) when you change domain rules.
- Platform phase checklist: [`platform_schema_and_mobile_plan.md`](platform_schema_and_mobile_plan.md)

---

## 2. Design principles

1. **Dynamic capabilities** — A merchant type does not rigidly determine features. A restaurant can sell a menu, host events, or both. An organizer can rent a venue. Capabilities will be exposed in onboarding/admin (V2 flags); V1 uses optional foreign keys on events.
2. **Merchants vs places** — Businesses (`merchants`) are not physical venues. Venues live in `places`.
3. **Backward compatibility** — `events.merchantId` remains the listing owner / ticket seller. New role fields are optional add-ons.
4. **Embeddings on discoverable entities** — `products`, `merchants`, `places`, and **users** (taste vectors) each carry optional vectors for recommendations.
5. **Super-aggregator** — External silo data maps to existing domain entities first; extend schema only when multiple sources expose richer fields we lack.

---

## 3. Entity glossary

| Entity | Table | Meaning |
|--------|-------|---------|
| User | `users` | Clerk-authenticated account; optional platform/merchant roles; onboarding profile + taste embedding |
| Merchant | `merchants` | Business: restaurant, retail vendor, event organizer |
| Place | `places` | Physical location, especially venues |
| Product | `products` | Catalog/menu item or grocery SKU |
| Event | `events` | Ticketed or listed happening |
| Artist | `artists` | Performer; populated via ingestion (BandsInTown, Computicket, Howler) — not schema-only |
| Order | `orders` | Checkout record (`orderKind`: product, ticket, bundle, resale) |

---

## 4. Merchants vs places

**Merchant** — sells products, may organize or host events. Types: `restaurant | retail | event_organizer | other`. **Not** a venue.

**Place** — physical site (`placeKind: venue | other`). May link to a co-located merchant via `linkedMerchantId` / `merchants.linkedPlaceId`.

**Why not `merchants.type = venue`?** Organizers rent venues; restaurants host events without being organizers; same address can be both place and merchant.

---

## 5. Event role model

| Field | Role |
|-------|------|
| `merchantId` | Listing owner — owns event page, sells tickets (required) |
| `organizerMerchantId?` | Promoter; defaults to `merchantId` in UI if unset |
| `hostMerchantId?` | On-site business (e.g. restaurant hosting live music) |
| `venuePlaceId?` | Physical venue (`places`) |

| Scenario | organizer | host | venue |
|----------|-----------|------|-------|
| Restaurant hosts own event | restaurant | restaurant | linked place or null |
| Organizer rents venue | promoter | null | venue place |
| Restaurant + external promoter | promoter | restaurant | venue place |

---

## 6. Products & catalog

- **Grocery:** global `products` linked to `ycago-grocery` merchant via `merchantId` backfill.
- **Menu:** merchant-scoped products (`productKind: menu`).
- **Media metadata** (overlay layout):

| Field | Purpose |
|-------|---------|
| `mediaAspect` | `square \| portrait45 \| portrait34 \| landscape \| story` (Instagram ratios) |
| `imageWidth` / `imageHeight` | Stored dimensions for renderer fallback |
| `imageStorageId` | Convex file storage |

---

## 7. Users & access

| Role | Guard | Scope |
|------|-------|-------|
| `platformAdmin` | `requirePlatformAdmin()` | All merchants, all orders, platform metrics |
| `merchantOwner` / `merchantMembers` | `requireMerchantAccess()` | Single merchant admin |
| Customer | Auth optional | Mobile/web storefront |

**Customer onboarding (V1):** Convex `users` row stores `dateOfBirth`, `interestCategoryIds` (from dynamic `categories` table), `notificationSettings`, `onboardingCompletedAt`, and optional `embedding`. Mobile keeps SecureStore as offline cache; signed-in users gate on server profile. Interaction signals (`userInteractions`: view / favorite / purchase) recompute the user embedding for personalized Discover/home feeds.

**V2:** Onboarding personas (venue owner, organizer-only, restaurant+events) will map to capability flags + membership creation flows.

---

## 8. Discovery-first feed algorithm

Personalization **ranks** taste-matched content higher — it does **not** restrict the catalog. Signed-in users see different **order**, not exclusive content. No auth gate on catalog reads.

| Step | Rule |
|------|------|
| Candidate pools | Build events, places, merchants, products, posts, grocery highlights via `_buildShowcaseFeed` + pool split |
| Taste pool (signed-in + embedding) | Vector search on products, merchants; places when embeddings exist; ranked by score |
| Exploration pool | Items **not** in taste pool; rotate by `discoverCategorySlugs`, entity type, city, `feedHighlight`, daily seed |
| Compose | Taste-first at top; alternating bands (2 taste → 1 explore → 2 taste → 1 explore) until `limit` |
| Backfill | If taste pool is thin or repeats familiar entities, fill from exploration — **never** a taste-only feed |
| Dedupe | By entity id only; never exclude entire categories |
| Guest / no embedding | Daily-seed slot composer (interleave pools); no vector injection |
| Logging | `[AuthFlow] home feedReady`: `tasteSlots`, `exploreSlots`, `categorySpread`, `entityTypeSpread` |
| Interaction loop | `userInteractions` updates embeddings over time — exploration becomes future taste signal |

**Rejected:** rigid "~20% personalized / 80% showcase" caps; taste-only filter bubbles; hiding entity types by auth state.

### Vector embeddings (entity tables)

| Table | Text composition | Index | API |
|-------|------------------|-------|-----|
| `products` | name, description, category | `products.by_embedding` | `products.findSimilar` |
| `merchants` | name, tagline, description, type, categories | `merchants.by_embedding` | `discovery.findSimilarPlaces` |
| `places` | name, description, address, placeKind | `places.by_embedding` | `discovery.findSimilarPlaces` |
| `users` | interest tags + interaction-weighted entity embeddings | `users.by_embedding` | `discovery.getPersonalizedFeed`, `userEmbeddings.recomputeForUser` |

Unified discovery merges merchant + place vector search for “Places similar to …”.

### Discover category drill-down

- `discoverCategorySlugs` on feed entities (separate from display `feedCategories`) powers Discover tile filtering.
- `getDiscoverFeed({ categorySlug, limit })` applies the same discovery-first bands within a category scope.

---

## 9. Commerce & orders extensions

**Orders (V1 stubs on schema, partial UI):**
- `fulfillmentType`: `delivery | pickup`
- `scheduledDeliveryAt`, `promoCodeId`, `membershipApplied`

**Stub tables:** `promoCodes`, `memberships`, `walletBalances` — schema only; no redemption logic in V1.

---

## 10. V2 deferred

- Merchant capability flags (sell_menu, host_events, rent_venue, organize_events)
- Full onboarding wizards per persona
- Artist similarity search (requires artist embeddings post-ingestion)
- Instagram scraper (Phase 3+)

**Promoted from deferred via ingestion (Phase 1 local / Phase 2 Convex):**
- `artists` + `eventPerformers` — populated from BandsInTown, Computicket, Howler, etc.

---

## 11. Decision log

| Date | Decision | Rationale | Alternatives rejected | Affects |
|------|----------|-----------|----------------------|---------|
| 2026-05-23 | Separate `places` table for venues | Flexible organizer/host/venue combos | `merchants.type = venue` | `places`, `events.venuePlaceId` |
| 2026-05-23 | Event role refs optional on `events` | Same event page, multiple business roles | Single merchant-only model | `organizerMerchantId`, `hostMerchantId` |
| 2026-05-23 | Embeddings on merchants + places | “Similar businesses/places” in product overlay | Merchant-only embeddings | `embeddingsMerchants`, `embeddingsPlaces`, `discovery` |
| 2026-05-23 | `mediaAspect` enum on products/events | Drive Discover overlay sheet snap heights | Infer from storage only | `products`, `events`, mobile renderer |
| 2026-05-23 | Instagram aspect tokens | Match design reference (1:1, 4:5, 3:4, 1.91:1, 9:16) | Generic portrait/landscape only | seed, `DynamicMediaRenderer` |
| 2026-05-23 | User taste embeddings + onboarding profile on `users` | Personalized Discover/home; server onboarding gate | Local-only SecureStore preferences | `users`, `userInteractions`, `userProfile`, `userEmbeddings`, `discovery.getPersonalizedFeed`, mobile onboarding |
| 2026-05-24 | Discovery-first personalization | Taste-first ranking without catalog restriction; tastes evolve via interactions | Rigid ~20% caps, taste-only bubbles | `discovery.getPersonalizedFeed`, domain §8 |
| 2026-05-24 | Vet-before-DB ingestion | Map SA catalog in Obsidian before sales/outreach | Direct Convex scrape writes | `discovery-ingestion/`, §13 |
| 2026-05-24 | Full Google + menu source capture | Preserve generous API payloads and menu URLs for vetting | Minimal place fields only | §14, SQLite `places`, `menu_items` |
| 2026-05-24 | Multi-source event scraping | Howler, Computicket, Quicket, Webtickets, Fever, AirDosh, BandsInTown in Phase 1 | Single-source catalog | `discovery-ingestion/scrapers/` |
| 2026-05-24 | Event calendar + trend engine | Unified calendars from scraped dates; trend signals | Raw rows only | `calendar_months`, `trend_signals` |
| 2026-05-24 | Organizer + listing_signals capture | Scrape promoter contact/socials + cross-platform listing URLs | Event rows only | `organizers`, `listing_signals` |
| 2026-05-24 | Browser recon gate before scrapers | Mandatory site visit + recon doc per source | Aimless scraper builds | `recon/*.md`, `scraper_selectors.yaml` |
| 2026-05-24 | Deal/experience platforms | Fomosa + Hyperli scraped as `deals` rows | Events table for deals | SQLite `deals` |
| 2026-05-24 | Browser-agent selector discovery + manual CAPTCHA | Reuse arbitrage-detector Playwright patterns | Automated CAPTCHA solving | headed `--pause-on-captcha` |
| 2026-05-24 | Super-aggregator entity map | Scrape → map to existing domain model first; extend schema from silo richness | Parallel ad-hoc SQLite schema | §15, `entity_aliases` |
| 2026-05-24 | Artists via ingestion (not V2-only) | `artists` + `eventPerformers` from BandsInTown, Computicket, Howler | Defer artists to V2 UI | `artists`, `eventPerformers`, §3, §10 |

---

## 12. Onboarding backend (implementation record)

See prior §12 content in git history for onboarding profile, embedding recompute, and mobile gate details. Unchanged by this update.

---

## 13. Staged external ingestion (V1 local, V2 Convex)

| Stage | Store | Purpose |
|-------|-------|---------|
| Discovery | SQLite + Obsidian | Scrape, dedupe, human vet |
| Promotion | Convex (Phase 2) | Approved listings only |
| Claim | Convex `claimStatus` (Phase 2) | Business onboarding prefill |

**Phase 1 rule:** No Convex writes from scrapers. Showcase seed (`seedShowcase.ts`) remains for app demo.

---

## 14. Rich source capture (Google + menus)

| Captured | Phase 1 store | Phase 2 if approved |
|----------|---------------|---------------------|
| Full Place Details JSON | `places.google_raw_json` | audit reference |
| Photo URLs + attributions | `photo_urls_json` | Convex storage |
| Website, Google Maps URL, menu listing URL | `website`, `google_maps_url`, `menu_listing_url` | profile links |
| Scraped menu items + per-item `source_url` | `menu_items` table | `products` (`productKind: menu`) |
| Experience deals (Fomosa, Hyperli) | `deals` table | `merchants` + `products` (`productKind: deal`) |
| Organizers + listing signals | `organizers`, `listing_signals` tables | `merchants` prefill, `sourceListingUrls` |
| Event calendars + trends | `calendar_months`, `calendar_weeks`, `trend_signals` | Feed highlights, discover rotation |
| Google product/catalogue fields | `catalog_items` table | `products` where applicable |
| All source links | `source_links` table | entity metadata |
| Artists + event performers | `artists`, `event_performers` tables | Convex `artists` + `eventPerformers` |
| Cross-silo aliases | `entity_aliases` table | Merge same artist/venue across platforms |

---

## 15. Super-aggregator entity map

1. **Map to existing Convex entities first** — `merchants`, `places`, `events`, `artists`, `eventPerformers`, `products`
2. **SQLite mirrors Convex** in Phase 1 — not a parallel ad-hoc schema
3. **`listing_signals`** — tracks where entities already list (SEO + "you're on Quicket" outreach pitch)
4. **Schema expansion process:** silo field → SQLite `raw_*` → document below → add to Convex after Obsidian vet

| Proposed field | Entity | Seen on | Purpose |
|----------------|--------|---------|---------|
| `imageUrl` / `imageStorageId` | `artists` | BandsInTown, Computicket | Artist cards in feed |
| `socialLinks` / `sameAs[]` | `artists`, `merchants` | BandsInTown JSON-LD, AirDosh | Outreach + verification |
| `sourceListingUrls[]` | `merchants`, `places`, `events`, `artists` | All ticket platforms | "Already on Quicket" pitch |
| `externalIds` map | all entities | All scrapers | `{quicket: "123", bandsintown: "456"}` |
| `rsvpCount` / `interestCount` | `events` | BandsInTown cards | Trend signals |
| `embedding` | `artists` | Post-import | Artist similarity search |

**Rule:** Do not add Convex fields until at least one scraper populates them in SQLite and Obsidian vet confirms the shape.
