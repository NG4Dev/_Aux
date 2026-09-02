import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  TICKET_INSTANCE_STATUS,
  TICKET_OFFER_MS,
  WAITING_LIST_STATUS,
} from "../constants/platform";
import { requireCurrentUser } from "./_auth";
import { processQueueForTicketType } from "./waitingList";

async function getAvailabilityCounts(
  ctx: MutationCtx,
  ticketTypeId: Id<"ticketTypes">,
) {
  const ticketType = await ctx.db.get(ticketTypeId);
  if (ticketType === null) {
    throw new Error("Ticket type not found");
  }

  const now = Date.now();
  const activeOffers = await ctx.db
    .query("waitingListEntries")
    .withIndex("by_ticket_type_status", (q) =>
      q.eq("ticketTypeId", ticketTypeId).eq("status", "offered"),
    )
    .collect()
    .then(
      (entries) =>
        entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length,
    );

  const remaining = ticketType.capacity - (ticketType.soldCount + activeOffers);
  return { ticketType, remaining, activeOffers };
}

export const joinWaitingList = mutation({
  args: { ticketTypeId: v.id("ticketTypes") },
  returns: v.object({
    waitingListEntryId: v.id("waitingListEntries"),
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("purchased"),
      v.literal("expired"),
    ),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const existing = await ctx.db
      .query("waitingListEntries")
      .withIndex("by_user_and_ticket_type", (q) =>
        q.eq("userId", user._id).eq("ticketTypeId", args.ticketTypeId),
      )
      .filter((q) => q.neq(q.field("status"), "expired"))
      .first();
    if (existing !== null) {
      throw new Error("Already in waiting list for this ticket type");
    }

    const { remaining } = await getAvailabilityCounts(ctx, args.ticketTypeId);
    const now = Date.now();

    if (remaining > 0) {
      const waitingListEntryId = await ctx.db.insert("waitingListEntries", {
        ticketTypeId: args.ticketTypeId,
        userId: user._id,
        status: WAITING_LIST_STATUS.OFFERED,
        offerExpiresAt: now + TICKET_OFFER_MS,
        createdAt: now,
      });

      await ctx.scheduler.runAfter(
        TICKET_OFFER_MS,
        internal.platform.waitingList.expireOffer,
        { waitingListEntryId, ticketTypeId: args.ticketTypeId },
      );

      return {
        waitingListEntryId,
        status: WAITING_LIST_STATUS.OFFERED as "offered",
        message: "Ticket offered — you have 15 minutes to purchase",
      };
    }

    const waitingListEntryId = await ctx.db.insert("waitingListEntries", {
      ticketTypeId: args.ticketTypeId,
      userId: user._id,
      status: WAITING_LIST_STATUS.WAITING,
      createdAt: now,
    });

    return {
      waitingListEntryId,
      status: WAITING_LIST_STATUS.WAITING as "waiting",
      message: "Added to waiting list — you'll be notified when available",
    };
  },
});

export const createTicketOrder = mutation({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    waitingListEntryId: v.optional(v.id("waitingListEntries")),
    quantity: v.optional(v.number()),
  },
  returns: v.object({
    orderId: v.id("orders"),
    totalCents: v.number(),
    currency: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const quantity = args.quantity ?? 1;
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10) {
      throw new Error("INVALID_QUANTITY");
    }

    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (ticketType === null || !ticketType.isActive) {
      throw new Error("TICKET_UNAVAILABLE");
    }

    const event = await ctx.db.get(ticketType.eventId);
    if (event === null || event.isCancelled) {
      throw new Error("EVENT_UNAVAILABLE");
    }

    if (args.waitingListEntryId !== undefined) {
      const entry = await ctx.db.get(args.waitingListEntryId);
      if (
        entry === null ||
        entry.userId !== user._id ||
        entry.ticketTypeId !== args.ticketTypeId ||
        entry.status !== WAITING_LIST_STATUS.OFFERED
      ) {
        throw new Error("INVALID_WAITING_LIST_OFFER");
      }
    } else {
      const { remaining } = await getAvailabilityCounts(ctx, args.ticketTypeId);
      if (remaining < quantity) {
        throw new Error("SOLD_OUT");
      }
    }

    const totalCents = ticketType.priceCents * quantity;
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      merchantId: event.merchantId,
      orderKind: "ticket",
      ticketTypeId: args.ticketTypeId,
      ticketQuantity: quantity,
      status: "pending",
      subtotalCents: totalCents,
      shippingCents: 0,
      totalCents,
      currency: ticketType.currency,
      hadFreeShipping: true,
      shippingAddress: user.address ?? {
        fullName: user.name ?? user.email,
        line1: "Digital ticket",
        city: "N/A",
        region: "N/A",
        postalCode: "00000",
        country: "GB",
      },
      reservedUntil: now + 30 * 60 * 1000,
      createdAt: now,
    });

    await ctx.db.patch(ticketType._id, {
      soldCount: ticketType.soldCount + quantity,
    });

    if (args.waitingListEntryId !== undefined) {
      await ctx.db.patch(args.waitingListEntryId, {
        status: WAITING_LIST_STATUS.PURCHASED,
      });
    }

    return { orderId, totalCents, currency: ticketType.currency };
  },
});

export const fulfillTicketOrder = internalMutation({
  args: {
    orderId: v.id("orders"),
    ticketTypeId: v.id("ticketTypes"),
    quantity: v.number(),
    paymentIntentId: v.optional(v.string()),
  },
  returns: v.array(v.id("ticketInstances")),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (order === null) {
      throw new Error("Order not found");
    }

    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (ticketType === null) {
      throw new Error("Ticket type not found");
    }

    const now = Date.now();
    const instanceIds: Id<"ticketInstances">[] = [];

    for (let i = 0; i < args.quantity; i++) {
      const qrPayload = `${order._id}:${ticketType._id}:${now}:${i}`;
      const id = await ctx.db.insert("ticketInstances", {
        ticketTypeId: args.ticketTypeId,
        orderId: args.orderId,
        ownerUserId: order.userId,
        status: TICKET_INSTANCE_STATUS.VALID,
        qrPayload,
        transferable: true,
        purchasedAt: now,
        paymentIntentId: args.paymentIntentId,
      });
      instanceIds.push(id);
    }

    await processQueueForTicketType(ctx, args.ticketTypeId);
    return instanceIds;
  },
});

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("ticketInstances"),
      _creationTime: v.number(),
      status: v.union(
        v.literal("valid"),
        v.literal("used"),
        v.literal("refunded"),
        v.literal("cancelled"),
        v.literal("listed_for_resale"),
      ),
      qrPayload: v.string(),
      ticketTypeName: v.string(),
      eventName: v.string(),
      merchantSlug: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const tickets = await ctx.db
      .query("ticketInstances")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
      .take(100);

    return await Promise.all(
      tickets.map(async (ticket) => {
        const ticketType = await ctx.db.get(ticket.ticketTypeId);
        const event =
          ticketType !== null ? await ctx.db.get(ticketType.eventId) : null;
        const merchant =
          event !== null ? await ctx.db.get(event.merchantId) : null;
        return {
          _id: ticket._id,
          _creationTime: ticket._creationTime,
          status: ticket.status,
          qrPayload: ticket.qrPayload,
          ticketTypeName: ticketType?.name ?? "Ticket",
          eventName: event?.name ?? "Event",
          merchantSlug: merchant?.slug ?? "",
        };
      }),
    );
  },
});
