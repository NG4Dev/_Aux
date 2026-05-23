import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const EMBEDDING_DIM = 1536;

function averageVectors(vectors: number[][]): number[] | null {
  if (vectors.length === 0) {
    return null;
  }
  const dim = vectors[0]?.length ?? EMBEDDING_DIM;
  const sum = new Array<number>(dim).fill(0);
  for (const vector of vectors) {
    if (vector.length !== dim) continue;
    for (let i = 0; i < dim; i++) {
      sum[i] += vector[i] ?? 0;
    }
  }
  return sum.map((value) => value / vectors.length);
}

export const _collectInterestEmbeddings = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.array(v.float64())),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null || user.interestCategoryIds === undefined) {
      return [];
    }
    const vectors: number[][] = [];
    for (const categoryId of user.interestCategoryIds) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .take(20);
      let addedFromProducts = false;
      for (const product of products) {
        if (product.embedding !== undefined && product.isActive) {
          vectors.push(product.embedding);
          addedFromProducts = true;
        }
      }

      if (!addedFromProducts) {
        const category = await ctx.db.get(categoryId);
        if (category?.embedding !== undefined) {
          vectors.push(category.embedding);
        }
      }
    }
    return vectors;
  },
});

export const _collectInteractionEmbeddings = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.object({ vector: v.array(v.float64()), weight: v.number() })),
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("userInteractions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);

    const weighted: Array<{ vector: number[]; weight: number }> = [];

    for (const interaction of interactions) {
      let embedding: number[] | undefined;
      if (interaction.entityType === "product") {
        const product = await ctx.db.get(interaction.entityId as Id<"products">);
        embedding = product?.embedding;
      } else if (interaction.entityType === "merchant") {
        const merchant = await ctx.db.get(interaction.entityId as Id<"merchants">);
        embedding = merchant?.embedding;
      }
      if (embedding !== undefined) {
        weighted.push({ vector: embedding, weight: interaction.weight });
      }
    }
    return weighted;
  },
});

function weightedAverage(
  items: Array<{ vector: number[]; weight: number }>,
): number[] | null {
  if (items.length === 0) {
    return null;
  }
  const dim = items[0]?.vector.length ?? EMBEDDING_DIM;
  const sum = new Array<number>(dim).fill(0);
  let totalWeight = 0;
  for (const item of items) {
    if (item.vector.length !== dim) continue;
    totalWeight += item.weight;
    for (let i = 0; i < dim; i++) {
      sum[i] += (item.vector[i] ?? 0) * item.weight;
    }
  }
  if (totalWeight === 0) {
    return null;
  }
  return sum.map((value) => value / totalWeight);
}

export const recomputeForUser = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null) {
      return null;
    }

    const interestVectors = await ctx.runQuery(
      internal.userEmbeddings._collectInterestEmbeddings,
      { userId: args.userId },
    );
    const interactionItems = await ctx.runQuery(
      internal.userEmbeddings._collectInteractionEmbeddings,
      { userId: args.userId },
    );

    const interestAvg = averageVectors(interestVectors);
    const interactionAvg = weightedAverage(interactionItems);

    let finalVector: number[] | null = null;
    if (interestAvg !== null && interactionAvg !== null) {
      finalVector = averageVectors([interestAvg, interactionAvg]);
    } else {
      finalVector = interactionAvg ?? interestAvg;
    }

    if (finalVector === null) {
      return null;
    }

    await ctx.db.patch(args.userId, {
      embedding: finalVector,
      embeddingUpdatedAt: Date.now(),
    });
    return null;
  },
});
