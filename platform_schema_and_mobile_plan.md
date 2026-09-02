# Platform Schema + Mobile Integration Plan

Accountability document for Phases 4–5. Parent plan: [`repo_reorganisation_plan.md`](repo_reorganisation_plan.md).

**Domain model (DB decisions — source of truth):** [`domain_model_decisions.md`](domain_model_decisions.md) at this workspace root. Consult before schema changes, onboarding flows, or admin persona work. Created in commerce flow Phase 0C ([NG-33](https://linear.app/ng4/issue/NG-33)); entity definitions below will move there — this file keeps phase checklist and verification only.

**Convex deployment:** cloud dev `tacit-iguana-891`  
**Linear project:** [Toqo Repo Reorganisation](https://linear.app/ng4/project/toqo-repo-reorganisation-c6c781e4dd0e)

## Phase checklist

| Phase | Linear | Status | Verification |
|-------|--------|--------|--------------|
| 4A — ERD + design doc | [NG-9](https://linear.app/ng4/issue/NG-9) | In progress | This file exists |
| 4B — Schema backbone | [NG-10](https://linear.app/ng4/issue/NG-10) | Pending | `npx convex dev --once` succeeds |
| 4C — Seed + admin routing | [NG-11](https://linear.app/ng4/issue/NG-11) | Pending | Platform admin sees all merchants; merchant owner scoped |
| 4D — Mobile Convex + screens | [NG-12](https://linear.app/ng4/issue/NG-12) | Pending | Detail/cart/checkout routes with Convex data |
| 4E — Cross-platform payments | [NG-13](https://linear.app/ng4/issue/NG-13) | Pending | Mobile payment → web admin |
| 4F — Resale UI | [NG-14](https://linear.app/ng4/issue/NG-14) | Pending | List/buy/transfer ticket resale |
| 5A — Admin Figma rebuild | [NG-15](https://linear.app/ng4/issue/NG-15) | Pending | Role-aware admin nav |
| 5B — Customer Figma reskin | [NG-16](https://linear.app/ng4/issue/NG-16) | Pending | ycago tokens on web + mobile |

---

## Current Convex ERD (live at Phase 3 completion)

Tables: `users`, `categories`, `products`, `favorites`, `orders`, `orderItems`.

- `users.role` = optional `"admin"` only (platform grocery admin)
- Products are global grocery SKUs (no merchant)
- Orders are product checkout only

---

## Target schema (merchant-centric)

Merchants hub catalog + events + tickets + resale. Papamart grocery tables remain; `products.merchantId` links grocery to default merchant.

New tables: `merchants`, `merchantMembers`, `events`, `ticketTypes`, `guestListEntries`, `waitingListEntries`, `ticketInstances`, `ticketResales`, `ticketPackages`, `packageItems`.

Extended: `orders` (+ `orderKind`, `merchantId`), `users` (+ `platformAdmin` | `merchantOwner` roles), `products` (+ optional `merchantId`).

---

## Gap matrix

| Capability | Current Convex | Ticket-marketplace ref | Legacy Postgres | Mobile mocks |
|------------|----------------|------------------------|-----------------|--------------|
| Merchants | No | Implicit (userId on event) | `businesses` | `BUSINESSES` |
| Products per merchant | Global grocery | N/A | `products` | `MENU_ITEMS` |
| Events | No | `events` | `events` | Feed `contentType: event` |
| Ticket tiers | No | Single price on event | `tickets` + tier enum | Events tab |
| Queue / waiting list | No | `waitingList` | N/A | N/A |
| Guest list | No | N/A | `guest_lists` | N/A |
| Ticket packages | No | N/A | N/A | N/A |
| Resale | No | No | `ticket_resales` | Planned 4F |
| Stripe Connect | No | `users.stripeConnectId` | N/A | N/A |
| Social / messaging | No | No | posts, messages | Chat tab (later) |

---

## Admin personas

| Persona | Route prefix | Convex guard |
|---------|--------------|--------------|
| Platform admin | `/admin/platform/*` | `requirePlatformAdmin()` |
| Merchant owner | `/admin/merchant/[slug]/*` | `requireMerchantAccess()` |
| Customer | `(client)/`, mobile tabs | Auth optional / signed-in |

---

## Mobile screen gap

| Screen | Before | Target |
|--------|--------|--------|
| Product detail | Missing | `business/[id]/product/[productId]` |
| Event detail | Missing | `business/[id]/event/[eventId]` |
| Cart | Icon only | Zustand + sheet |
| Checkout | Missing | Convex checkout actions |
| Resale | Missing | My tickets → sell (4F) |

---

## Verification commands

```powershell
# Schema deploy
cd user-business-web
npx convex dev --once

# Seed platform data
npx convex run seedPlatform:seedPlatform

# Promote platform admin
cmd /c 'npx convex run --deployment dev admin/_helpers:promoteToAdmin "{\"clerkUserId\":\"user_XXX\"}"'

# Mobile
cd user-business-mobile/MobileApp
pnpm start
```
