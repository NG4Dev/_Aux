import { v } from "convex/values";
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

const similarPlaceResultValidator = v.object({  kind: v.union(v.literal("merchant"), v.literal("place")),
  id: v.string(),
  name: v.string(),
  slug: v.string(),
  tagline: v.optional(v.string()),
  score: v.number(),
});

export const findSimilarPlaces = action({
  args: {
    sourceMerchantId: v.optional(v.id("merchants")),
    sourcePlaceId: v.optional(v.id("places")),
    limit: v.optional(v.number()),
  },
  returns: v.array(similarPlaceResultValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    let vector: number[] | null = null;
    let excludeMerchantId: Id<"merchants"> | null = null;
    let excludePlaceId: Id<"places"> | null = null;

    if (args.sourceMerchantId) {
      const source = await ctx.runQuery(api.platform.merchants.getById, {
        merchantId: args.sourceMerchantId,
      });
      if (source?.embedding) {
        vector = source.embedding;
        excludeMerchantId = args.sourceMerchantId;
      }
    } else if (args.sourcePlaceId) {
      const source = await ctx.runQuery(api.platform.places.getById, {
        placeId: args.sourcePlaceId,
      });
      if (source?.embedding) {
        vector = source.embedding;
        excludePlaceId = args.sourcePlaceId;
      }
    }

    if (vector === null) {
      return [];
    }

    const [merchantResults, placeResults] = await Promise.all([
      ctx.vectorSearch("merchants", "by_embedding", {
        vector,
        limit: limit + 1,
        filter: (q) => q.eq("isActive", true),
      }),
      ctx.vectorSearch("places", "by_embedding", {
        vector,
        limit: limit + 1,
        filter: (q) => q.eq("isActive", true),
      }),
    ]);

    const merged: Array<{
      kind: "merchant" | "place";
      id: string;
      name: string;
      slug: string;
      tagline?: string;
      score: number;
    }> = [];

    for (const hit of merchantResults) {
      if (hit._id === excludeMerchantId) continue;
      const doc = await ctx.runQuery(api.platform.merchants.getById, {
        merchantId: hit._id,
      });
      if (doc === null) continue;
      merged.push({
        kind: "merchant",
        id: hit._id,
        name: doc.name,
        slug: doc.slug,
        tagline: doc.tagline,
        score: hit._score,
      });
    }

    for (const hit of placeResults) {
      if (hit._id === excludePlaceId) continue;
      const doc = await ctx.runQuery(api.platform.places.getById, {
        placeId: hit._id,
      });
      if (doc === null) continue;
      merged.push({
        kind: "place",
        id: hit._id,
        name: doc.name,
        slug: doc.slug,
        score: hit._score,
      });
    }

    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, limit);
  },
});

const personalizedFeedItemValidator = v.object({
  kind: v.union(v.literal("product"), v.literal("merchant")),
  id: v.string(),
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.union(v.string(), v.null()),
  merchantSlug: v.optional(v.string()),
  productSlug: v.optional(v.string()),
  score: v.optional(v.number()),
  personalized: v.boolean(),
});

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const getPersonalizedFeed = action({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(personalizedFeedItemValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 40);
    const exploreCount = Math.max(1, Math.floor(limit * 0.2));
    const personalizedCount = limit - exploreCount;

    const profile = await ctx.runQuery(api.userProfile.getProfile, {});
    const feed: Array<{
      kind: "product" | "merchant";
      id: string;
      title: string;
      subtitle?: string;
      description?: string;
      imageUrl: string | null;
      merchantSlug?: string;
      productSlug?: string;
      score?: number;
      personalized: boolean;
    }> = [];
    const seenIds = new Set<string>();

    if (profile?.embedding !== undefined) {
      const [productResults, merchantResults] = await Promise.all([
        ctx.vectorSearch("products", "by_embedding", {
          vector: profile.embedding,
          limit: personalizedCount + 5,
          filter: (q) => q.eq("isActive", true),
        }),
        ctx.vectorSearch("merchants", "by_embedding", {
          vector: profile.embedding,
          limit: Math.max(2, Math.floor(personalizedCount / 2) + 2),
          filter: (q) => q.eq("isActive", true),
        }),
      ]);

      const productIds = productResults
        .slice(0, personalizedCount)
        .map((hit) => hit._id);
      const scoreByProductId = new Map(
        productResults.map((hit) => [hit._id, hit._score]),
      );
      const hydratedProducts = await ctx.runQuery(
        internal.products._hydrateActiveByIds,
        { ids: productIds },
      );

      for (const product of hydratedProducts) {
        if (seenIds.has(product._id)) continue;
        let merchantSlug: string | undefined;
        if (product.merchantId !== undefined) {
          const merchant = await ctx.runQuery(api.platform.merchants.getById, {
            merchantId: product.merchantId,
          });
          merchantSlug = merchant?.slug;
        }
        seenIds.add(product._id);
        feed.push({
          kind: "product",
          id: product._id,
          title: product.name,
          subtitle: merchantSlug,
          description: product.description,
          imageUrl: product.imageUrl,
          merchantSlug,
          productSlug: product.slug,
          score: scoreByProductId.get(product._id),
          personalized: true,
        });
      }

      for (const hit of merchantResults) {
        if (feed.filter((f) => f.personalized && f.kind === "merchant").length >= 2) {
          break;
        }
        if (seenIds.has(hit._id)) continue;
        const merchant = await ctx.runQuery(api.platform.merchants.getById, {
          merchantId: hit._id,
        });
        if (merchant === null) continue;
        seenIds.add(hit._id);
        feed.push({
          kind: "merchant",
          id: hit._id,
          title: merchant.name,
          subtitle: merchant.tagline,
          description: merchant.description,
          imageUrl: null,
          merchantSlug: merchant.slug,
          score: hit._score,
          personalized: true,
        });
      }
    }

    const catalog = await ctx.runQuery(api.products.list, { limit: 60 });
    const explorationPool = shuffle(
      catalog.filter((product) => !seenIds.has(product._id)),
    ).slice(0, exploreCount);

    for (const product of explorationPool) {
      let merchantSlug: string | undefined;
      if (product.merchantId !== undefined) {
        const merchant = await ctx.runQuery(api.platform.merchants.getById, {
          merchantId: product.merchantId,
        });
        merchantSlug = merchant?.slug;
      }
      feed.push({
        kind: "product",
        id: product._id,
        title: product.name,
        subtitle: merchantSlug,
        description: product.description,
        imageUrl: product.imageUrl,
        merchantSlug,
        productSlug: product.slug,
        personalized: false,
      });
    }

    if (feed.length === 0) {
      for (const product of catalog.slice(0, limit)) {
        let merchantSlug: string | undefined;
        if (product.merchantId !== undefined) {
          const merchant = await ctx.runQuery(api.platform.merchants.getById, {
            merchantId: product.merchantId,
          });
          merchantSlug = merchant?.slug;
        }
        feed.push({
          kind: "product",
          id: product._id,
          title: product.name,
          subtitle: merchantSlug,
          description: product.description,
          imageUrl: product.imageUrl,
          merchantSlug,
          productSlug: product.slug,
          personalized: false,
        });
      }
    }

    return feed.slice(0, limit);
  },
});
