import { v } from "convex/values";
import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { userRoleValidator } from "../schema";

function isPlatformAdminRole(role: Doc<"users">["role"]): boolean {
  return role === "admin" || role === "platformAdmin";
}

/**
 * Resolve the caller's Convex `users` doc and assert platform admin role.
 * Accepts legacy `"admin"` as an alias for `"platformAdmin"`.
 */
export async function requirePlatformAdmin(
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
    throw new Error("User record not found");
  }
  if (!isPlatformAdminRole(user.role)) {
    throw new Error("Forbidden: platform admin role required");
  }
  return user;
}

/** @deprecated Use requirePlatformAdmin — kept for existing admin modules. */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  return requirePlatformAdmin(ctx);
}

export async function requireMerchantAccess(
  ctx: QueryCtx | MutationCtx,
  merchantId: Id<"merchants">,
): Promise<{ user: Doc<"users">; merchant: Doc<"merchants"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not signed in");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (user === null) {
    throw new Error("User record not found");
  }

  const merchant = await ctx.db.get(merchantId);
  if (merchant === null) {
    throw new Error("Merchant not found");
  }

  if (isPlatformAdminRole(user.role)) {
    return { user, merchant };
  }

  if (merchant.ownerUserId === user._id) {
    return { user, merchant };
  }

  const membership = await ctx.db
    .query("merchantMembers")
    .withIndex("by_merchant_and_user", (q) =>
      q.eq("merchantId", merchantId).eq("userId", user._id),
    )
    .unique();
  if (membership === null) {
    throw new Error("Forbidden: merchant access required");
  }

  return { user, merchant };
}

export async function getMerchantBySlugOrThrow(
  ctx: QueryCtx | MutationCtx,
  slug: string,
): Promise<Doc<"merchants">> {
  const merchant = await ctx.db
    .query("merchants")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (merchant === null) {
    throw new Error(`Merchant not found: ${slug}`);
  }
  return merchant;
}

export const promoteToAdmin = internalMutation({
  args: {
    clerkUserId: v.string(),
    role: v.optional(v.union(userRoleValidator, v.null())),
  },
  returns: v.object({
    userId: v.id("users"),
    role: v.union(userRoleValidator, v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId),
      )
      .unique();
    if (user === null) {
      throw new Error(
        `No Convex user found for clerkUserId="${args.clerkUserId}". ` +
          `The user must sign in once so EnsureUser/Clerk webhook creates their record.`,
      );
    }
    const nextRole =
      args.role === undefined ? ("platformAdmin" as const) : args.role;
    if (nextRole === null) {
      await ctx.db.patch(user._id, { role: undefined });
      return { userId: user._id, role: null };
    }
    await ctx.db.patch(user._id, { role: nextRole });
    return { userId: user._id, role: nextRole };
  },
});

export const assignMerchantOwner = internalMutation({
  args: {
    clerkUserId: v.string(),
    merchantSlug: v.string(),
  },
  returns: v.object({
    userId: v.id("users"),
    merchantId: v.id("merchants"),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId),
      )
      .unique();
    if (user === null) {
      throw new Error(`No Convex user for clerkUserId="${args.clerkUserId}"`);
    }

    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      throw new Error(`Merchant not found: ${args.merchantSlug}`);
    }

    await ctx.db.patch(user._id, { role: "merchantOwner" });
    await ctx.db.patch(merchant._id, { ownerUserId: user._id });

    const existingMember = await ctx.db
      .query("merchantMembers")
      .withIndex("by_merchant_and_user", (q) =>
        q.eq("merchantId", merchant._id).eq("userId", user._id),
      )
      .unique();
    if (existingMember === null) {
      await ctx.db.insert("merchantMembers", {
        merchantId: merchant._id,
        userId: user._id,
        role: "owner",
        createdAt: Date.now(),
      });
    }

    return { userId: user._id, merchantId: merchant._id };
  },
});
