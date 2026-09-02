# Import Discovery Platform GTM container

## Before import

1. Create a **Web** GTM container for the discovery property.
2. Create GA4 property + Web data stream; copy Measurement ID (`G-…`).
3. Open [`discovery-platform-container-import.json`](./discovery-platform-container-import.json) and replace **all** `G-XXXXXXXXXX` with your Measurement ID.
4. Optionally replace `GTM-XXXXXXX` with your container public ID (cosmetic for import merge).

## Import (Merge, not Overwrite)

1. Open [tagmanager.google.com](https://tagmanager.google.com) → your Discovery container.
2. **Admin** → **Import Container**.
3. Choose the local JSON file above (not a cloud-only stub).
4. Workspace: **Existing** → **Default Workspace**.
5. Import option: **Merge** → **Overwrite conflicting tags, triggers, and variables**.
6. Confirm. You should see:
   - GA4 Configuration
   - GA4 Set User / Clear User
   - Event tags for consumer ecommerce + merchant_* events
7. **Submit** → version notes → **Publish**.

## What this adds

| Item | Detail |
|------|--------|
| Config tag | Measurement ID placeholder → your `G-…`, All Pages (`send_page_view=false`; app pushes `page_view`) |
| Identity | `ga4_user_set` / `ga4_user_clear` set reserved `user_id` + user property `user_type` |
| Ecommerce | `view_item`, `add_to_cart`, `begin_checkout`, `purchase` with `sendEcommerceData` from dataLayer |
| Merchant | `merchant_profile_completed`, `merchant_listing_created`, `merchant_promo_published`, `merchant_first_order`, `merchant_order_received` |
| Variables | DLVs for persona, merchant_*, city, content_type, order_kind, UTMs, experiment fields |

## Env vars (web)

```
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ENABLE_GTM=true
NEXT_PUBLIC_GTM_ID=GTM-…
NEXT_PUBLIC_MIXPANEL_TOKEN=…
NEXT_PUBLIC_CLARITY_ID=…
```

Convex (server purchase / merchant order):

```
GA4_MEASUREMENT_ID=G-…
GA4_MP_API_SECRET=…
MIXPANEL_TOKEN=…
```

## After publish

1. Load a production/preview build with analytics enabled.
2. GA4 **DebugView** / Realtime: confirm `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.
3. Register custom definitions + key events per Mission Control playbook `03` / `11`.
4. Link Clarity → same GA4 property; confirm Mixpanel **Order Paid** vs GA4 `purchase` ±5%.
