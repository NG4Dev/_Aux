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

function composeCategoryEmbeddingText(input: {
  name: string;
  discoverGroup?: string;
}): string {
  return [
    input.name,
    input.discoverGroup ? `Group: ${input.discoverGroup}` : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

export const _getCategoryForEmbedding = internalQuery({
  args: { categoryId: v.id("categories") },
  returns: v.union(
    v.object({
      name: v.string(),
      discoverGroup: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      return null;
    }
    return {
      name: category.name,
      discoverGroup: category.discoverGroup,
    };
  },
});

export const _setCategoryEmbedding = internalMutation({
  args: {
    categoryId: v.id("categories"),
    embedding: v.array(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      return null;
    }
    await ctx.db.patch(args.categoryId, { embedding: args.embedding });
    return null;
  },
});

export const _listDiscoverCategoryIdsMissingEmbedding = internalQuery({
  args: {},
  returns: v.array(v.id("categories")),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories
      .filter(
        (category) =>
          category.discoverGroup !== undefined && category.embedding === undefined,
      )
      .map((category) => category._id);
  },
});

export const _listAllDiscoverCategoryIds = internalQuery({
  args: {},
  returns: v.array(v.id("categories")),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories
      .filter((category) => category.discoverGroup !== undefined)
      .map((category) => category._id);
  },
});

export const generateForCategory = internalAction({
  args: { categoryId: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.runQuery(
      internal.embeddingsCategories._getCategoryForEmbedding,
      { categoryId: args.categoryId },
    );
    if (category === null) {
      return null;
    }
    const text = composeCategoryEmbeddingText(category);
    if (text.length === 0) {
      return null;
    }

    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: text,
    });

    await ctx.runMutation(internal.embeddingsCategories._setCategoryEmbedding, {
      categoryId: args.categoryId,
      embedding,
    });
    return null;
  },
});

/** Embed onboarding/discover categories that do not have vectors yet. */
export const backfillDiscoverCategories = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx, args): Promise<{ scheduled: number }> => {
    const ids: Array<Id<"categories">> = args.force
      ? await ctx.runQuery(internal.embeddingsCategories._listAllDiscoverCategoryIds, {})
      : await ctx.runQuery(
          internal.embeddingsCategories._listDiscoverCategoryIdsMissingEmbedding,
          {},
        );

    for (const categoryId of ids) {
      await ctx.scheduler.runAfter(
        0,
        internal.embeddingsCategories.generateForCategory,
        { categoryId },
      );
    }
    return { scheduled: ids.length };
  },
});
