import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import {
  ESCROW_STATUS,
  TICKET_INSTANCE_STATUS,
} from "../constants/platform";
import { requireCurrentUser } from "./_auth";

export const listActive = query({
  args: { eventId: v.optional(v.id("events")) },
  returns: v.array(
    v.object({
      _id: v.id("ticketResales"),
      resalePriceCents: v.number(),
      currency: v.string(),
      listedAt: v.number(),
      ticketTypeName: v.string(),
      eventName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("ticketResales")
      .withIndex("by_escrow_status", (q) => q.eq("escrowStatus", "pending"))
      .take(100);

    const results = [];
    for (const listing of listings) {
      const instance = await ctx.db.get(listing.ticketInstanceId);
      if (instance === null || instance.status !== "listed_for_resale") {
        continue;
      }
      const ticketType = await ctx.db.get(instance.ticketTypeId);
      if (ticketType === null) {
        continue;
      }
      const event = await ctx.db.get(ticketType.eventId);
      if (event === null) {
        continue;
      }
      if (args.eventId !== undefined && event._id !== args.eventId) {
        continue;
      }
      results.push({
        _id: listing._id,
        resalePriceCents: listing.resalePriceCents,
        currency: listing.currency,
        listedAt: listing.listedAt,
        ticketTypeName: ticketType.name,
        eventName: event.name,
      });
    }
    return results;
  },
});

export const listForSeller = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("ticketResales"),
      escrowStatus: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
      resalePriceCents: v.number(),
      currency: v.string(),
      listedAt: v.number(),
      soldAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db
      .query("ticketResales")
      .withIndex("by_seller", (q) => q.eq("sellerUserId", user._id))
      .take(50);
  },
});

export const listForSale = mutation({
  args: {
    ticketInstanceId: v.id("ticketInstances"),
    resalePriceCents: v.number(),
  },
  returns: v.id("ticketResales"),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (args.resalePriceCents <= 0) {
      throw new Error("INVALID_PRICE");
    }

    const instance = await ctx.db.get(args.ticketInstanceId);
    if (
      instance === null ||
      instance.ownerUserId !== user._id ||
      instance.status !== TICKET_INSTANCE_STATUS.VALID ||
      !instance.transferable
    ) {
      throw new Error("TICKET_NOT_ELIGIBLE");
    }

    const existing = await ctx.db
      .query("ticketResales")
      .withIndex("by_ticket_instance", (q) =>
        q.eq("ticketInstanceId", args.ticketInstanceId),
      )
      .filter((q) => q.eq(q.field("escrowStatus"), "pending"))
      .first();
    if (existing !== null) {
      throw new Error("ALREADY_LISTED");
    }

    const ticketType = await ctx.db.get(instance.ticketTypeId);
    if (ticketType === null) {
      throw new Error("Ticket type not found");
    }

    await ctx.db.patch(instance._id, {
      status: TICKET_INSTANCE_STATUS.LISTED_FOR_RESALE,
    });

    return await ctx.db.insert("ticketResales", {
      ticketInstanceId: args.ticketInstanceId,
      sellerUserId: user._id,
      resalePriceCents: args.resalePriceCents,
      currency: ticketType.currency,
      escrowStatus: ESCROW_STATUS.PENDING,
      listedAt: Date.now(),
    });
  },
});

export const createResaleOrder = mutation({
  args: { resaleId: v.id("ticketResales") },
  returns: v.object({
    orderId: v.id("orders"),
    totalCents: v.number(),
    currency: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const listing = await ctx.db.get(args.resaleId);
    if (listing === null || listing.escrowStatus !== ESCROW_STATUS.PENDING) {
      throw new Error("LISTING_UNAVAILABLE");
    }
    if (listing.sellerUserId === user._id) {
      throw new Error("CANNOT_BUY_OWN_LISTING");
    }

    const instance = await ctx.db.get(listing.ticketInstanceId);
    if (instance === null || instance.status !== "listed_for_resale") {
      throw new Error("TICKET_UNAVAILABLE");
    }

    const ticketType = await ctx.db.get(instance.ticketTypeId);
    if (ticketType === null) {
      throw new Error("Ticket type not found");
    }
    const event = await ctx.db.get(ticketType.eventId);
    if (event === null) {
      throw new Error("Event not found");
    }

    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      merchantId: event.merchantId,
      orderKind: "resale",
      resaleId: args.resaleId,
      status: "pending",
      subtotalCents: listing.resalePriceCents,
      shippingCents: 0,
      totalCents: listing.resalePriceCents,
      currency: listing.currency,
      hadFreeShipping: true,
      shippingAddress: user.address ?? {
        fullName: user.name ?? user.email,
        line1: "Digital ticket resale",
        city: "N/A",
        region: "N/A",
        postalCode: "00000",
        country: "GB",
      },
      reservedUntil: now + 30 * 60 * 1000,
      createdAt: now,
    });

    await ctx.db.patch(listing._id, { buyerUserId: user._id });
    return {
      orderId,
      totalCents: listing.resalePriceCents,
      currency: listing.currency,
    };
  },
});

export const completeEscrow = internalMutation({
  args: {
    resaleId: v.id("ticketResales"),
    paymentIntentId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.resaleId);
    if (listing === null || listing.buyerUserId === undefined) {
      throw new Error("Resale listing not found");
    }

    const instance = await ctx.db.get(listing.ticketInstanceId);
    if (instance === null) {
      throw new Error("Ticket instance not found");
    }

    await ctx.db.patch(instance._id, {
      ownerUserId: listing.buyerUserId,
      status: TICKET_INSTANCE_STATUS.VALID,
    });

    await ctx.db.patch(listing._id, {
      escrowStatus: ESCROW_STATUS.COMPLETED,
      soldAt: Date.now(),
      stripePaymentIntentId: args.paymentIntentId,
    });

    return null;
  },
});

export const cancelListing = mutation({
  args: { resaleId: v.id("ticketResales") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const listing = await ctx.db.get(args.resaleId);
    if (
      listing === null ||
      listing.sellerUserId !== user._id ||
      listing.escrowStatus !== ESCROW_STATUS.PENDING
    ) {
      throw new Error("LISTING_NOT_FOUND");
    }

    const instance = await ctx.db.get(listing.ticketInstanceId);
    if (instance !== null) {
      await ctx.db.patch(instance._id, { status: TICKET_INSTANCE_STATUS.VALID });
    }

    await ctx.db.patch(listing._id, { escrowStatus: ESCROW_STATUS.CANCELLED });
    return null;
  },
});
