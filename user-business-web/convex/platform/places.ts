import { v } from "convex/values";
import { query } from "../_generated/server";
import schema from "../schema";

const placeDocValidator = v.object({
  _id: v.id("places"),
  _creationTime: v.number(),
  ...schema.tables.places.validator.fields,
});

export const getById = query({
  args: { placeId: v.id("places") },
  returns: v.union(placeDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.placeId);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(placeDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("places")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listActive = query({
  args: {},
  returns: v.array(placeDocValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("places")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(100);
  },
});
