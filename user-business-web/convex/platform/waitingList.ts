import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { TICKET_OFFER_MS, WAITING_LIST_STATUS } from "../constants/platform";
import { requireCurrentUser } from "./_auth";

export async function processQueueForTicketType(
  ctx: MutationCtx,
  ticketTypeId: Id<"ticketTypes">,
) {
  const ticketType = await ctx.db.get(ticketTypeId);
  if (ticketType === null) {
    return;
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

  const availableSpots = ticketType.capacity - (ticketType.soldCount + activeOffers);
  if (availableSpots <= 0) {
    return;
  }

  const waitingUsers = await ctx.db
    .query("waitingListEntries")
    .withIndex("by_ticket_type_status", (q) =>
      q.eq("ticketTypeId", ticketTypeId).eq("status", "waiting"),
    )
    .take(availableSpots);

  for (const entry of waitingUsers) {
    await ctx.db.patch(entry._id, {
      status: WAITING_LIST_STATUS.OFFERED,
      offerExpiresAt: now + TICKET_OFFER_MS,
    });
    await ctx.scheduler.runAfter(
      TICKET_OFFER_MS,
      internal.platform.waitingList.expireOffer,
      { waitingListEntryId: entry._id, ticketTypeId },
    );
  }
}

export const getQueuePosition = query({
  args: { ticketTypeId: v.id("ticketTypes") },
  returns: v.union(
    v.null(),
    v.object({
      status: v.union(
        v.literal("waiting"),
        v.literal("offered"),
        v.literal("purchased"),
        v.literal("expired"),
      ),
      position: v.number(),
      offerExpiresAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const entry = await ctx.db
      .query("waitingListEntries")
      .withIndex("by_user_and_ticket_type", (q) =>
        q.eq("userId", user._id).eq("ticketTypeId", args.ticketTypeId),
      )
      .filter((q) => q.neq(q.field("status"), "expired"))
      .first();
    if (entry === null) {
      return null;
    }

    const peopleAhead = await ctx.db
      .query("waitingListEntries")
      .withIndex("by_ticket_type_status", (q) =>
        q.eq("ticketTypeId", args.ticketTypeId).eq("status", "waiting"),
      )
      .filter((q) => q.lt(q.field("_creationTime"), entry._creationTime))
      .collect()
      .then((entries) => entries.length);

    return {
      status: entry.status,
      position: peopleAhead + 1,
      offerExpiresAt: entry.offerExpiresAt,
    };
  },
});

export const expireOffer = internalMutation({
  args: {
    waitingListEntryId: v.id("waitingListEntries"),
    ticketTypeId: v.id("ticketTypes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.waitingListEntryId);
    if (offer === null || offer.status !== WAITING_LIST_STATUS.OFFERED) {
      return null;
    }
    await ctx.db.patch(args.waitingListEntryId, {
      status: WAITING_LIST_STATUS.EXPIRED,
    });
    await processQueueForTicketType(ctx, args.ticketTypeId);
    return null;
  },
});

export const releaseOffer = mutation({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    waitingListEntryId: v.id("waitingListEntries"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const entry = await ctx.db.get(args.waitingListEntryId);
    if (
      entry === null ||
      entry.userId !== user._id ||
      entry.status !== WAITING_LIST_STATUS.OFFERED
    ) {
      throw new Error("No valid ticket offer found");
    }
    await ctx.db.patch(args.waitingListEntryId, {
      status: WAITING_LIST_STATUS.EXPIRED,
    });
    await processQueueForTicketType(ctx, args.ticketTypeId);
    return null;
  },
});
