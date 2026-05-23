import { v } from "convex/values";
import { query } from "./_generated/server";
import schema from "./schema";

const categoryWithImageValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  ...schema.tables.categories.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
});

const onboardingGroupValidator = v.object({
  group: v.string(),
  categories: v.array(categoryWithImageValidator),
});

export const list = query({
  args: {},
  returns: v.array(categoryWithImageValidator),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .order("asc")
      .take(100);

    return await Promise.all(
      categories.map(async (category) => ({
        ...category,
        imageUrl: category.imageStorageId
          ? await ctx.storage.getUrl(category.imageStorageId)
          : null,
      })),
    );
  },
});

/**
 * Interest chips for onboarding — grouped by `discoverGroup`, ordered by
 * backend `sortOrder` only (no client-side taxonomy).
 */
export const listForOnboarding = query({
  args: {},
  returns: v.array(onboardingGroupValidator),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .order("asc")
      .take(250);

    const interests = categories.filter((c) => c.discoverGroup !== undefined);

    const withImages = await Promise.all(
      interests.map(async (category) => ({
        ...category,
        imageUrl: category.imageStorageId
          ? await ctx.storage.getUrl(category.imageStorageId)
          : null,
      })),
    );

    const byGroup = new Map<
      string,
      Array<(typeof withImages)[number]>
    >();
    for (const category of withImages) {
      const group = category.discoverGroup!;
      const list = byGroup.get(group) ?? [];
      list.push(category);
      byGroup.set(group, list);
    }

    return [...byGroup.entries()]
      .sort(([, a], [, b]) => {
        const minA = Math.min(...a.map((c) => c.sortOrder));
        const minB = Math.min(...b.map((c) => c.sortOrder));
        return minA - minB;
      })
      .map(([group, groupCategories]) => ({
        group,
        categories: groupCategories,
      }));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(categoryWithImageValidator, v.null()),
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (category === null) {
      return null;
    }

    return {
      ...category,
      imageUrl: category.imageStorageId
        ? await ctx.storage.getUrl(category.imageStorageId)
        : null,
    };
  },
});
