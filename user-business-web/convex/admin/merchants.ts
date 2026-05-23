import { v } from "convex/values";
import { query } from "../_generated/server";
import schema from "../schema";
import { requirePlatformAdmin, requireMerchantAccess } from "./_helpers";

const merchantDocValidator = v.object({
  _id: v.id("merchants"),
  _creationTime: v.number(),
  ...schema.tables.merchants.validator.fields,
});

export const listAll = query({
  args: {},
  returns: v.array(merchantDocValidator),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    return await ctx.db.query("merchants").order("desc").take(200);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(merchantDocValidator, v.null()),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (merchant === null) {
      return null;
    }
    await requireMerchantAccess(ctx, merchant._id);
    return merchant;
  },
});

export const listOrdersForMerchant = query({
  args: { merchantSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      ...schema.tables.orders.validator.fields,
      itemCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      return [];
    }
    await requireMerchantAccess(ctx, merchant._id);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .order("desc")
      .take(100);

    return await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .take(50);
        return { ...order, itemCount: items.length };
      }),
    );
  },
});
