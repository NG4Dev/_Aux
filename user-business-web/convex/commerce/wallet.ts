import { v } from "convex/values";
import { query } from "../_generated/server";

/** V1 stub — always returns zero balance until wallet debit is implemented. */
export const getBalance = query({
  args: {},
  returns: v.object({
    balanceCents: v.number(),
    currency: v.string(),
  }),
  handler: async () => {
    return {
      balanceCents: 0,
      currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp",
    };
  },
});
