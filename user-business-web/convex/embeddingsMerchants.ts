import { v } from "convex/values";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const EMBEDDING_MODEL = "text-embedding-3-small";

function composeEmbeddingText(input: {
  name: string;
  tagline: string;
  description: string;
  type: string;
  categoryNames: string[];
}): string {
  return [
    input.name,
    input.tagline,
    input.description,
    `Type: ${input.type}`,
    input.categoryNames.length > 0
      ? `Categories: ${input.categoryNames.join(", ")}`
      : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

export const _getMerchantForEmbedding = internalQuery({
  args: { merchantId: v.id("merchants") },
  returns: v.union(
    v.object({
      name: v.string(),
      tagline: v.string(),
      description: v.string(),
      type: v.string(),
      categoryNames: v.array(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (merchant === null) {
      return null;
    }
    const products = await ctx.db
      .query("products")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .take(50);
    const categoryNames = new Set<string>();
    for (const product of products) {
      const category = await ctx.db.get(product.categoryId);
      if (category) {
        categoryNames.add(category.name);
      }
    }
    return {
      name: merchant.name,
      tagline: merchant.tagline ?? "",
      description: merchant.description ?? "",
      type: merchant.type,
      categoryNames: [...categoryNames],
    };
  },
});

export const _setEmbedding = internalMutation({
  args: {
    merchantId: v.id("merchants"),
    embedding: v.array(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (merchant === null) {
      return null;
    }
    await ctx.db.patch(args.merchantId, { embedding: args.embedding });
    return null;
  },
});

export const _listMerchantIdsMissingEmbedding = internalQuery({
  args: {},
  returns: v.array(v.id("merchants")),
  handler: async (ctx) => {
    const merchants = await ctx.db.query("merchants").collect();
    return merchants
      .filter((m) => m.embedding === undefined)
      .map((m) => m._id);
  },
});

export const _listAllMerchantIds = internalQuery({
  args: {},
  returns: v.array(v.id("merchants")),
  handler: async (ctx) => {
    const merchants = await ctx.db.query("merchants").collect();
    return merchants.map((m) => m._id);
  },
});

export const generateForMerchant = internalAction({
  args: { merchantId: v.id("merchants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const merchant = await ctx.runQuery(
      internal.embeddingsMerchants._getMerchantForEmbedding,
      { merchantId: args.merchantId },
    );
    if (merchant === null) {
      return null;
    }
    const text = composeEmbeddingText(merchant);
    if (text.length === 0) {
      return null;
    }

    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: text,
    });

    await ctx.runMutation(internal.embeddingsMerchants._setEmbedding, {
      merchantId: args.merchantId,
      embedding,
    });
    return null;
  },
});

export const backfillAll = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx, args): Promise<{ scheduled: number }> => {
    const ids: Array<Id<"merchants">> = args.force
      ? await ctx.runQuery(internal.embeddingsMerchants._listAllMerchantIds, {})
      : await ctx.runQuery(
          internal.embeddingsMerchants._listMerchantIdsMissingEmbedding,
          {},
        );

    for (const merchantId of ids) {
      await ctx.scheduler.runAfter(
        0,
        internal.embeddingsMerchants.generateForMerchant,
        { merchantId },
      );
    }
    return { scheduled: ids.length };
  },
});
