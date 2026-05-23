import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
}

export async function requireCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await getCurrentUserOrNull(ctx);
  if (user === null) {
    throw new Error("NOT_SIGNED_IN");
  }
  return user;
}
