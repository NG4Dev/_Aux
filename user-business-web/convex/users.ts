import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema, { addressValidator } from "./schema";

const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  ...schema.tables.users.validator.fields,
});

function isPlatformAdminRole(role: Doc<"users">["role"]): boolean {
  return role === "admin" || role === "platformAdmin";
}

async function getUserByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

const authSessionStatusValidator = v.object({
  userId: v.id("users"),
  isNewUser: v.boolean(),
  hasDateOfBirth: v.boolean(),
  onboardingComplete: v.boolean(),
});

function buildAuthSessionStatus(user: Doc<"users">, isNewUser: boolean) {
  return {
    userId: user._id,
    isNewUser,
    hasDateOfBirth:
      user.dateOfBirth !== undefined && user.dateOfBirth.length > 0,
    onboardingComplete: user.onboardingCompletedAt !== undefined,
  };
}

async function ensureCurrentUserRecord(ctx: MutationCtx): Promise<{
  user: Doc<"users">;
  isNewUser: boolean;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not signed in");
  }

  const existing = await getUserByClerkId(ctx, identity.subject);
  const email = identity.email ?? undefined;
  const name = identity.name ?? undefined;
  const imageUrl =
    typeof identity.pictureUrl === "string" ? identity.pictureUrl : undefined;

  if (existing !== null) {
    const patch: Partial<Doc<"users">> = {};
    if (email !== undefined && existing.email !== email) {
      patch.email = email;
    }
    if (name !== undefined && existing.name !== name) {
      patch.name = name;
    }
    if (imageUrl !== undefined && existing.imageUrl !== imageUrl) {
      patch.imageUrl = imageUrl;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      const updated = await ctx.db.get(existing._id);
      if (updated === null) {
        throw new Error("User record disappeared after patch");
      }
      return { user: updated, isNewUser: false };
    }
    return { user: existing, isNewUser: false };
  }

  if (!email) {
    throw new Error(
      "Clerk identity is missing an email claim — cannot create Convex user. " +
        "Verify the Clerk JWT template includes the email scope.",
    );
  }

  const userId = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    email,
    name,
    imageUrl,
    createdAt: Date.now(),
  });
  const user = await ctx.db.get(userId);
  if (user === null) {
    throw new Error("Failed to create user record");
  }
  return { user, isNewUser: true };
}

export const currentUser = query({
  args: {},
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return await getUserByClerkId(ctx, identity.subject);
  },
});

export const getAdminContext = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      role: v.union(
        v.literal("admin"),
        v.literal("platformAdmin"),
        v.literal("merchantOwner"),
      ),
      merchants: v.array(
        v.object({
          _id: v.id("merchants"),
          slug: v.string(),
          name: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    const user = await getUserByClerkId(ctx, identity.subject);
    if (user === null || user.role === undefined) {
      return null;
    }

    if (isPlatformAdminRole(user.role)) {
      return {
        role: (user.role === "admin" ? "platformAdmin" : user.role) as
          | "platformAdmin"
          | "admin",
        merchants: [],
      };
    }

    if (user.role !== "merchantOwner") {
      return null;
    }

    const owned = await ctx.db
      .query("merchants")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
      .take(20);

    const memberships = await ctx.db
      .query("merchantMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(20);

    const merchantIds = new Set(owned.map((m) => m._id));
    for (const membership of memberships) {
      merchantIds.add(membership.merchantId);
    }

    const merchants = await Promise.all(
      [...merchantIds].map(async (id) => {
        const merchant = await ctx.db.get(id);
        if (merchant === null) return null;
        return { _id: merchant._id, slug: merchant.slug, name: merchant.name };
      }),
    );

    return {
      role: "merchantOwner" as const,
      merchants: merchants.filter(
        (m): m is { _id: (typeof owned)[0]["_id"]; slug: string; name: string } =>
          m !== null,
      ),
    };
  },
});

export const ensureCurrent = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const { user } = await ensureCurrentUserRecord(ctx);
    return user._id;
  },
});

export const ensureCurrentWithStatus = mutation({
  args: {},
  returns: authSessionStatusValidator,
  handler: async (ctx) => {
    const { user, isNewUser } = await ensureCurrentUserRecord(ctx);
    return buildAuthSessionStatus(user, isNewUser);
  },
});

export const setAddress = mutation({
  args: { address: addressValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not signed in");
    }
    const user = await getUserByClerkId(ctx, identity.subject);
    if (user === null) {
      throw new Error("User record not found. Try refreshing.");
    }
    await ctx.db.patch(user._id, { address: args.address });
    return null;
  },
});

export const syncFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await getUserByClerkId(ctx, args.clerkUserId);
    if (existing !== null) {
      const patch: Partial<Doc<"users">> = {};
      if (args.email && existing.email !== args.email) {
        patch.email = args.email;
      }
      if (args.name !== undefined && existing.name !== args.name) {
        patch.name = args.name;
      }
      if (args.imageUrl !== undefined && existing.imageUrl !== args.imageUrl) {
        patch.imageUrl = args.imageUrl;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});
