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

---

## 3. Entity glossary

| Entity | Table | Meaning |
|--------|-------|---------|
| User | `users` | Clerk-authenticated account; optional platform/merchant roles; onboarding profile + taste embedding |
| Merchant | `merchants` | Business: restaurant, retail vendor, event organizer |
| Place | `places` | Physical location, especially venues |
| Product | `products` | Catalog/menu item or grocery SKU |
| Event | `events` | Ticketed or listed happening |
| Artist | `artists` | Performer (V2 stub) |
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
| `platformAdmin` | `requirePlatformAdmin()` | All merchants, platform admin routes |
| `merchantOwner` / `merchantMembers` | `requireMerchantAccess()` | Single merchant admin |
| Customer | Auth optional | Mobile/web storefront |

**Customer onboarding (V1):** Convex `users` row stores `dateOfBirth`, `interestCategoryIds` (from dynamic `categories` table), `notificationSettings`, `onboardingCompletedAt`, and optional `embedding`. Mobile keeps SecureStore as offline cache; signed-in users gate on server profile. Interaction signals (`userInteractions`: view / favorite / purchase) recompute the user embedding for personalized Discover/home feeds.

**V2:** Onboarding personas (venue owner, organizer-only, restaurant+events) will map to capability flags + membership creation flows.

---

## 8. Vector embeddings

| Table | Text composition | Index | API |
|-------|------------------|-------|-----|
| `products` | name, description, category | `products.by_embedding` | `products.findSimilar` |
| `merchants` | name, tagline, description, type, categories | `merchants.by_embedding` | `discovery.findSimilarPlaces` |
| `places` | name, description, address, placeKind | `places.by_embedding` | `discovery.findSimilarPlaces` |
| `users` | interest tags + interaction-weighted entity embeddings | `users.by_embedding` | `discovery.getPersonalizedFeed`, `userEmbeddings.recomputeForUser` |

Unified discovery merges merchant + place vector search for “Places similar to …”. Personalized feeds blend user-vector product/merchant search with ~20% exploration slots from the active catalog.

---

## 9. Commerce & orders extensions

**Orders (V1 stubs on schema, partial UI):**
- `fulfillmentType`: `delivery | pickup`
- `scheduledDeliveryAt`, `promoCodeId`, `membershipApplied`

**Stub tables:** `promoCodes`, `memberships`, `walletBalances` — schema only; no redemption logic in V1.

---

## 10. V2 deferred

- `artists` + `eventPerformers` (headliners)
- Merchant capability flags (sell_menu, host_events, rent_venue, organize_events)
- Full onboarding wizards per persona
- Artist similarity search

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
