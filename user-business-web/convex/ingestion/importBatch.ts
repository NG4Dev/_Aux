/**
 * PHASE 2 — Convex promotion from approved SQLite/Obsidian catalog rows.
 * Do NOT call until human vetting marks rows as `approved` in discovery-ingestion.
 *
 * Planned surface:
 * - importBatch({ entityType, sourceRunId, approvedOnly: true })
 * - claimMerchant({ merchantSlug, clerkUserId }) — prefill from scraped organizer data
 */
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const importBatch = internalMutation({
  args: {
    entityType: v.union(
      v.literal("places"),
      v.literal("events"),
      v.literal("artists"),
      v.literal("merchants"),
      v.literal("products"),
    ),
    sourceRunId: v.optional(v.string()),
    approvedOnly: v.literal(true),
  },
  returns: v.object({
    imported: v.number(),
    skipped: v.number(),
    message: v.string(),
  }),
  handler: async () => {
    return {
      imported: 0,
      skipped: 0,
      message:
        "Phase 2 deferred — promote approved rows from discovery-ingestion SQLite after Obsidian vet.",
    };
  },
});

export const claimMerchant = internalMutation({
  args: {
    merchantSlug: v.string(),
    clerkUserId: v.string(),
  },
  returns: v.object({
    claimed: v.boolean(),
    message: v.string(),
  }),
  handler: async () => {
    return {
      claimed: false,
      message: "Phase 2 deferred — claim flow ships after importBatch.",
    };
  },
});
