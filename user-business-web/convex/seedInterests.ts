import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/** Bootstrap data only — runtime source of truth is the `categories` table. */
const INTEREST_GROUPS: Array<{ group: string; items: string[] }> = [
  {
    group: "Attractions & Entertainment",
    items: [
      "Events venue",
      "Live music venue",
      "Nightclub",
      "Performing arts theatre",
      "Art Gallery",
      "Museum",
      "Cinema",
      "Theme Park",
      "Zoo",
      "Stadium",
    ],
  },
  {
    group: "Eating & Drinking",
    items: [
      "American restaurant",
      "Asian restaurant",
      "Bakery",
      "Buffet restaurant",
      "Cafe",
      "Chicken restaurant",
      "Chinese restaurant",
      "Fast food restaurant",
      "French restaurant",
      "Hamburger restaurant",
      "Indian restaurant",
      "Italian restaurant",
      "Japanese restaurant",
      "Korean restaurant",
      "Mexican restaurant",
      "Pizza restaurant",
      "Ramen restaurant",
      "Sandwich shop",
      "Seafood restaurant",
      "Sports bar",
      "Steak house",
      "Sushi restaurant",
      "Takeaway",
      "Tea Room",
      "Thai restaurant",
    ],
  },
  {
    group: "Shops & Shopping",
    items: [
      "Butchers",
      "Coffee Shop",
      "Craft shop",
      "Doughnut Shop",
      "General Store",
      "Health Food Shop",
      "Jewelry shop",
      "Clothing store",
      "Electronics",
      "Bookstore",
      "Supermarket",
      "Market",
      "Florist",
      "Pet shop",
    ],
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Upsert onboarding interest categories (does not remove grocery/product categories). */
export const seedInterestCategories = internalMutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx) => {
    let inserted = 0;
    let updated = 0;
    let sortOrder = 1000;

    for (const { group, items } of INTEREST_GROUPS) {
      for (const name of items) {
        const slug = slugify(name);
        const existing = await ctx.db
          .query("categories")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();

        if (existing === null) {
          await ctx.db.insert("categories", {
            name,
            slug,
            sortOrder,
            discoverGroup: group,
          });
          inserted += 1;
        } else {
          const patch: {
            name?: string;
            discoverGroup?: string;
            sortOrder?: number;
          } = {};
          if (existing.name !== name) patch.name = name;
          if (existing.discoverGroup !== group) patch.discoverGroup = group;
          if (existing.sortOrder !== sortOrder) patch.sortOrder = sortOrder;
          if (Object.keys(patch).length > 0) {
            await ctx.db.patch(existing._id, patch);
            updated += 1;
          }
        }
        sortOrder += 1;
      }
      sortOrder = Math.ceil(sortOrder / 1000) * 1000 + 1000;
    }

    await ctx.scheduler.runAfter(
      0,
      internal.embeddingsCategories.backfillDiscoverCategories,
      {},
    );

    return { inserted, updated };
  },
});
