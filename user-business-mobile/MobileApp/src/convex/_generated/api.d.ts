/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin__helpers from "../admin/_helpers.js";
import type * as admin_categories from "../admin/categories.js";
import type * as admin_customers from "../admin/customers.js";
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_events from "../admin/events.js";
import type * as admin_merchants from "../admin/merchants.js";
import type * as admin_orders from "../admin/orders.js";
import type * as admin_products from "../admin/products.js";
import type * as categories from "../categories.js";
import type * as checkout from "../checkout.js";
import type * as commerce_wallet from "../commerce/wallet.js";
import type * as constants_platform from "../constants/platform.js";
import type * as crons from "../crons.js";
import type * as embeddings from "../embeddings.js";
import type * as embeddingsCategories from "../embeddingsCategories.js";
import type * as embeddingsMerchants from "../embeddingsMerchants.js";
import type * as embeddingsPlaces from "../embeddingsPlaces.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as ingestion_importBatch from "../ingestion/importBatch.js";
import type * as orders from "../orders.js";
import type * as platform__auth from "../platform/_auth.js";
import type * as platform_categories from "../platform/categories.js";
import type * as platform_discovery from "../platform/discovery.js";
import type * as platform_events from "../platform/events.js";
import type * as platform_feed from "../platform/feed.js";
import type * as platform_feedMedia from "../platform/feedMedia.js";
import type * as platform_merchants from "../platform/merchants.js";
import type * as platform_places from "../platform/places.js";
import type * as platform_resale from "../platform/resale.js";
import type * as platform_tickets from "../platform/tickets.js";
import type * as platform_waitingList from "../platform/waitingList.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as seedInterests from "../seedInterests.js";
import type * as seedPlatform from "../seedPlatform.js";
import type * as seedShowcase from "../seedShowcase.js";
import type * as userEmbeddings from "../userEmbeddings.js";
import type * as userProfile from "../userProfile.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/_helpers": typeof admin__helpers;
  "admin/categories": typeof admin_categories;
  "admin/customers": typeof admin_customers;
  "admin/dashboard": typeof admin_dashboard;
  "admin/events": typeof admin_events;
  "admin/merchants": typeof admin_merchants;
  "admin/orders": typeof admin_orders;
  "admin/products": typeof admin_products;
  categories: typeof categories;
  checkout: typeof checkout;
  "commerce/wallet": typeof commerce_wallet;
  "constants/platform": typeof constants_platform;
  crons: typeof crons;
  embeddings: typeof embeddings;
  embeddingsCategories: typeof embeddingsCategories;
  embeddingsMerchants: typeof embeddingsMerchants;
  embeddingsPlaces: typeof embeddingsPlaces;
  favorites: typeof favorites;
  http: typeof http;
  "ingestion/importBatch": typeof ingestion_importBatch;
  orders: typeof orders;
  "platform/_auth": typeof platform__auth;
  "platform/categories": typeof platform_categories;
  "platform/discovery": typeof platform_discovery;
  "platform/events": typeof platform_events;
  "platform/feed": typeof platform_feed;
  "platform/feedMedia": typeof platform_feedMedia;
  "platform/merchants": typeof platform_merchants;
  "platform/places": typeof platform_places;
  "platform/resale": typeof platform_resale;
  "platform/tickets": typeof platform_tickets;
  "platform/waitingList": typeof platform_waitingList;
  products: typeof products;
  seed: typeof seed;
  seedInterests: typeof seedInterests;
  seedPlatform: typeof seedPlatform;
  seedShowcase: typeof seedShowcase;
  userEmbeddings: typeof userEmbeddings;
  userProfile: typeof userProfile;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
