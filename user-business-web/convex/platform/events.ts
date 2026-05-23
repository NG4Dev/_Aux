import { v } from "convex/values";
import { query } from "../_generated/server";
import schema from "../schema";

const eventDocValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  ...schema.tables.events.validator.fields,
});

const ticketTypeDocValidator = v.object({
  _id: v.id("ticketTypes"),
  _creationTime: v.number(),
  ...schema.tables.ticketTypes.validator.fields,
});

export const listUpcoming = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      event: eventDocValidator,
      merchant: v.object({
        _id: v.id("merchants"),
        slug: v.string(),
        name: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_startTime")
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), now),
          q.or(
            q.eq(q.field("isCancelled"), undefined),
            q.eq(q.field("isCancelled"), false),
          ),
        ),
      )
      .take(args.limit ?? 50);

    return await Promise.all(
      events.map(async (event) => {
        const merchant = await ctx.db.get(event.merchantId);
        return {
          event,
          merchant: {
            _id: event.merchantId,
            slug: merchant?.slug ?? "",
            name: merchant?.name ?? "",
          },
        };
      }),
    );
  },
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
    return await ctx.db
      .query("events")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .take(100);
  },
});

export const getBySlug = query({
  args: { merchantSlug: v.string(), eventSlug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      event: eventDocValidator,
      merchant: v.object({
        _id: v.id("merchants"),
        slug: v.string(),
        name: v.string(),
      }),
      ticketTypes: v.array(ticketTypeDocValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      return null;
    }
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.eventSlug))
      .unique();
    if (event === null || event.merchantId !== merchant._id) {
      return null;
    }
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(20);
    return {
      event,
      merchant: {
        _id: merchant._id,
        slug: merchant.slug,
        name: merchant.name,
      },
      ticketTypes,
    };
  },
});

export const getAvailability = query({
  args: { ticketTypeId: v.id("ticketTypes") },
  returns: v.object({
    capacity: v.number(),
    soldCount: v.number(),
    activeOffers: v.number(),
    remaining: v.number(),
    isSoldOut: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (ticketType === null) {
      throw new Error("Ticket type not found");
    }

    const now = Date.now();
    const activeOffers = await ctx.db
      .query("waitingListEntries")
      .withIndex("by_ticket_type_status", (q) =>
        q.eq("ticketTypeId", args.ticketTypeId).eq("status", "offered"),
      )
      .collect()
      .then(
        (entries) =>
          entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length,
      );

    const reserved = ticketType.soldCount + activeOffers;
    const remaining = Math.max(0, ticketType.capacity - reserved);

    return {
      capacity: ticketType.capacity,
      soldCount: ticketType.soldCount,
      activeOffers,
      remaining,
      isSoldOut: remaining <= 0,
    };
  },
});
