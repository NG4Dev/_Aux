import { v } from "convex/values";
import { query } from "../_generated/server";

export const listDiscoverHome = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      label: v.string(),
      color: v.string(),
      image: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const tiles = categories
      .filter((c) => c.showOnDiscoverHome === true)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return await Promise.all(
      tiles.map(async (category) => ({
        id: category.slug,
        label: category.name,
        color: category.tileColor ?? "#37474F",
        image: category.imageStorageId
          ? await ctx.storage.getUrl(category.imageStorageId)
          : null,
      })),
    );
  },
});
