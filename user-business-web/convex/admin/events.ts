import { v } from "convex/values";
import { query } from "../_generated/server";
import schema from "../schema";
import { requireMerchantAccess, requirePlatformAdmin } from "./_helpers";

const eventDocValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  ...schema.tables.events.validator.fields,
});

export const listForMerchant = query({
  args: { merchantSlug: v.string() },
  returns: v.array(eventDocValidator),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      return [];
    }
    await requireMerchantAccess(ctx, merchant._id);
    return await ctx.db
      .query("events")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .take(100);
  },
});

export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      event: eventDocValidator,
      merchantName: v.string(),
      merchantSlug: v.string(),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const events = await ctx.db.query("events").order("desc").take(200);
    return await Promise.all(
      events.map(async (event) => {
        const merchant = await ctx.db.get(event.merchantId);
        return {
          event,
          merchantName: merchant?.name ?? "Unknown",
          merchantSlug: merchant?.slug ?? "",
        };
      }),
    );
  },
});

export const listGuestList = query({
  args: { eventId: v.id("events") },
  returns: v.array(
    v.object({
      _id: v.id("guestListEntries"),
      status: v.union(
        v.literal("confirmed"),
        v.literal("pending"),
        v.literal("declined"),
      ),
      userEmail: v.string(),
      userName: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (event === null) {
      return [];
    }
    await requireMerchantAccess(ctx, event.merchantId);

    const entries = await ctx.db
      .query("guestListEntries")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(200);

    return await Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          _id: entry._id,
          status: entry.status,
          userEmail: user?.email ?? "",
          userName: user?.name ?? null,
        };
      }),
    );
  },
});
