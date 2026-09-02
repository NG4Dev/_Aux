import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import schema from "./schema";

const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  ...schema.tables.users.validator.fields,
});

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed);
}

async function getCurrentUserOrThrow(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not signed in");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (user === null) {
    throw new Error("User record not found. Call ensureCurrent first.");
  }
  return user;
}

export const getProfile = query({
  args: {},
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    dateOfBirth: v.optional(v.string()),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const patch: Partial<Doc<"users">> = {};

    if (args.dateOfBirth !== undefined) {
      if (!isValidIsoDate(args.dateOfBirth)) {
        throw new Error("dateOfBirth must be an ISO date string (YYYY-MM-DD)");
      }
      patch.dateOfBirth = args.dateOfBirth;
      const steps = new Set(user.onboardingSteps ?? []);
      steps.add("dob");
      patch.onboardingSteps = [...steps];
    }

    if (args.interestCategoryIds !== undefined) {
      patch.interestCategoryIds = args.interestCategoryIds;
      const slugs: string[] = [];
      for (const categoryId of args.interestCategoryIds) {
        const category = await ctx.db.get(categoryId);
        if (category !== null) {
          slugs.push(category.slug);
        }
      }
      patch.interestTags = slugs;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
      await ctx.scheduler.runAfter(0, internal.userEmbeddings.recomputeForUser, {
        userId: user._id,
      });
    }
    return null;
  },
});

export const completeOnboardingStep = mutation({
  args: {
    step: v.string(),
    markComplete: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const steps = new Set(user.onboardingSteps ?? []);
    steps.add(args.step);
    const patch: Partial<Doc<"users">> = {
      onboardingSteps: [...steps],
    };
    if (args.markComplete === true) {
      const refreshed = await ctx.db.get(user._id);
      if (refreshed === null) {
        throw new Error("User record not found");
      }
      if (
        refreshed.dateOfBirth === undefined ||
        refreshed.dateOfBirth.length === 0
      ) {
        throw new Error(
          "Date of birth is required before completing onboarding",
        );
      }
      patch.onboardingCompletedAt = Date.now();
    }
    await ctx.db.patch(user._id, patch);
    if (args.markComplete === true) {
      await ctx.scheduler.runAfter(0, internal.userEmbeddings.recomputeForUser, {
        userId: user._id,
      });
    }
    return null;
  },
});

export const setNotificationSettings = mutation({
  args: {
    pushEnabled: v.boolean(),
    marketing: v.optional(v.boolean()),
    orderUpdates: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await ctx.db.patch(user._id, {
      notificationSettings: {
        pushEnabled: args.pushEnabled,
        marketing: args.marketing,
        orderUpdates: args.orderUpdates,
        handledAt: Date.now(),
      },
    });
    return null;
  },
});

const ACTION_WEIGHTS = {
  view: 1,
  favorite: 3,
  purchase: 5,
} as const;

export const logInteraction = mutation({
  args: {
    entityType: v.union(
      v.literal("product"),
      v.literal("merchant"),
      v.literal("event"),
    ),
    entityId: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("favorite"),
      v.literal("purchase"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await ctx.db.insert("userInteractions", {
      userId: user._id,
      entityType: args.entityType,
      entityId: args.entityId,
      action: args.action,
      weight: ACTION_WEIGHTS[args.action],
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.userEmbeddings.recomputeForUser, {
      userId: user._id,
    });
    return null;
  },
});

export const logPurchasesFromOrder = internalMutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .take(200);
    for (const item of items) {
      await ctx.db.insert("userInteractions", {
        userId: args.userId,
        entityType: "product",
        entityId: item.productId,
        action: "purchase",
        weight: ACTION_WEIGHTS.purchase,
        createdAt: Date.now(),
      });
    }
    if (items.length > 0) {
      await ctx.scheduler.runAfter(0, internal.userEmbeddings.recomputeForUser, {
        userId: args.userId,
      });
    }
    return null;
  },
});

export const shouldNotifyUser = internalQuery({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("order"), v.literal("marketing"), v.literal("event")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null) {
      return false;
    }
    const settings = user.notificationSettings;
    if (settings === undefined || !settings.pushEnabled) {
      return false;
    }
    if (args.kind === "marketing") {
      return settings.marketing !== false;
    }
    if (args.kind === "order") {
      return settings.orderUpdates !== false;
    }
    return true;
  },
});
