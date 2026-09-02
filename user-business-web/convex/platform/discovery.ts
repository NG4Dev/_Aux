import { v } from "convex/values";
import { action, type ActionCtx } from "../_generated/server";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { feedCardValidator, type FeedCard } from "./feedMedia";

const similarPlaceResultValidator = v.object({
  kind: v.union(v.literal("merchant"), v.literal("place")),
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

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((s / 4294967296) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cardKey(card: FeedCard): string {
  return `${card.kind}:${card.id}`;
}

function interleavePools(pools: FeedCard[][], limit: number): FeedCard[] {
  const result: FeedCard[] = [];
  const seen = new Set<string>();
  let round = 0;
  while (result.length < limit) {
    let added = false;
    for (const pool of pools) {
      const card = pool[round];
      if (!card) continue;
      const key = cardKey(card);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(card);
      added = true;
      if (result.length >= limit) break;
    }
    if (!added) break;
    round += 1;
  }
  return result;
}

function computeSpread(feed: FeedCard[]) {
  const categorySpread: Record<string, number> = {};
  const entityTypeSpread: Record<string, number> = {};
  for (const card of feed) {
    entityTypeSpread[card.kind] = (entityTypeSpread[card.kind] ?? 0) + 1;
    for (const cat of card.categories) {
      categorySpread[cat] = (categorySpread[cat] ?? 0) + 1;
    }
  }
  return { categorySpread, entityTypeSpread };
}

function composeDiscoveryFeed(
  tastePool: FeedCard[],
  explorePool: FeedCard[],
  limit: number,
): { feed: FeedCard[]; tasteSlots: number; exploreSlots: number } {
  const seen = new Set<string>();
  const result: FeedCard[] = [];
  let tasteIdx = 0;
  let exploreIdx = 0;
  let tasteSlots = 0;
  let exploreSlots = 0;
  let bandRound = 0;

  while (result.length < limit) {
    let added = false;
    for (let i = 0; i < 2 && result.length < limit; i++) {
      while (tasteIdx < tastePool.length) {
        const card = tastePool[tasteIdx++];
        const key = cardKey(card);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ ...card, personalized: true });
        tasteSlots += 1;
        added = true;
        break;
      }
    }
    if (result.length < limit) {
      while (exploreIdx < explorePool.length) {
        const card = explorePool[exploreIdx++];
        const key = cardKey(card);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ ...card, personalized: false });
        exploreSlots += 1;
        added = true;
        break;
      }
    }
    bandRound += 1;
    if (!added) break;
  }

  while (result.length < limit && exploreIdx < explorePool.length) {
    const card = explorePool[exploreIdx++];
    const key = cardKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...card, personalized: false });
    exploreSlots += 1;
  }

  while (result.length < limit && tasteIdx < tastePool.length) {
    const card = tastePool[tasteIdx++];
    const key = cardKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...card, personalized: true });
    tasteSlots += 1;
  }

  return { feed: result.slice(0, limit), tasteSlots, exploreSlots };
}

function buildGuestFeed(showcase: FeedCard[], limit: number, dailySeed: number): FeedCard[] {
  const eventPool = shuffleWithSeed(
    showcase.filter((c) => c.kind === "event"),
    dailySeed,
  );
  const placePool = shuffleWithSeed(
    showcase.filter((c) => c.kind === "place"),
    dailySeed + 1,
  );
  const merchantPool = shuffleWithSeed(
    showcase.filter((c) => c.kind === "merchant"),
    dailySeed + 2,
  );
  const productPool = shuffleWithSeed(
    showcase.filter((c) => c.kind === "product"),
    dailySeed + 3,
  );
  const postPool = shuffleWithSeed(
    showcase.filter((c) => c.kind === "post"),
    dailySeed + 4,
  );

  const eventSlots = Math.max(1, Math.round(limit * 0.35));
  const placeSlots = Math.max(1, Math.round(limit * 0.15));
  const merchantSlots = Math.max(1, Math.round(limit * 0.1));
  const showcaseProductSlots = Math.max(1, Math.round(limit * 0.25));
  const grocerySlots = Math.max(1, Math.round(limit * 0.1));
  const postSlots = Math.max(
    1,
    limit - eventSlots - placeSlots - merchantSlots - showcaseProductSlots - grocerySlots,
  );

  const menuProducts = productPool.filter((c) => c.merchantSlug !== "ycago-grocery");
  const groceryProducts = productPool.filter((c) => c.merchantSlug === "ycago-grocery");

  return interleavePools(
    [
      eventPool.slice(0, eventSlots + 2),
      [...placePool.slice(0, placeSlots), ...merchantPool.slice(0, merchantSlots)],
      menuProducts.slice(0, showcaseProductSlots + 2),
      groceryProducts.slice(0, grocerySlots + 1),
      postPool.slice(0, postSlots + 1),
    ],
    limit,
  ).map((card) => ({ ...card, personalized: false }));
}

async function buildTastePool(
  ctx: ActionCtx,
  embedding: number[],
  limit: number,
): Promise<FeedCard[]> {
  const tasteLimit = Math.max(limit, 12);
  const [productResults, merchantResults, placeResults] = await Promise.all([
    ctx.vectorSearch("products", "by_embedding", {
      vector: embedding,
      limit: tasteLimit + 8,
      filter: (q) => q.eq("isActive", true),
    }),
    ctx.vectorSearch("merchants", "by_embedding", {
      vector: embedding,
      limit: tasteLimit + 4,
      filter: (q) => q.eq("isActive", true),
    }),
    ctx.vectorSearch("places", "by_embedding", {
      vector: embedding,
      limit: tasteLimit + 4,
      filter: (q) => q.eq("isActive", true),
    }),
  ]);

  const productCards = (await ctx.runQuery(internal.platform.feed._hydrateProductCards, {
    ids: productResults.map((hit) => hit._id),
    personalized: true,
    scores: productResults.map((hit) => ({ id: hit._id, score: hit._score })),
  })) as FeedCard[];

  const merchantCards = (await ctx.runQuery(internal.platform.feed._hydrateMerchantCards, {
    ids: merchantResults.map((hit) => hit._id),
    personalized: true,
    scores: merchantResults.map((hit) => ({ id: hit._id, score: hit._score })),
  })) as FeedCard[];

  const placeCards: FeedCard[] = [];
  for (const hit of placeResults) {
    const place = await ctx.runQuery(api.platform.places.getById, { placeId: hit._id });
    if (!place || !place.isActive) continue;
    const merchant = place.linkedMerchantId
      ? await ctx.runQuery(api.platform.merchants.getById, {
          merchantId: place.linkedMerchantId,
        })
      : null;
    placeCards.push({
      kind: "place",
      contentType: "place",
      id: place._id,
      title: place.name,
      subtitle: merchant?.tagline ?? place.placeKind,
      description: place.description,
      media: [],
      profileName: merchant?.name ?? place.name,
      profileAvatar: null,
      merchantSlug: merchant?.slug,
      businessId: merchant?.slug ?? place.slug,
      categories: place.feedCategories?.length ? place.feedCategories : ["Discover"],
      verified: true,
      personalized: true,
      score: hit._score,
    });
  }

  const merged = [...productCards, ...merchantCards, ...placeCards].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  );

  const unique: FeedCard[] = [];
  const seen = new Set<string>();
  for (const card of merged) {
    const key = cardKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(card);
  }
  return unique;
}

async function composeFeed(
  ctx: ActionCtx,
  args: { limit: number; discoverCategorySlug?: string },
): Promise<FeedCard[]> {
  const limit = Math.min(args.limit, 40);
  const profile = await ctx.runQuery(api.userProfile.getProfile, {});
  const hasPersonalization = profile?.embedding !== undefined;
  const dailySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

  const eventSlots = Math.max(1, Math.round(limit * 0.35));
  const placeSlots = Math.max(1, Math.round(limit * 0.15));
  const merchantSlots = Math.max(1, Math.round(limit * 0.1));
  const showcaseProductSlots = Math.max(1, Math.round(limit * 0.25));
  const grocerySlots = Math.max(1, Math.round(limit * 0.1));
  const postSlots = Math.max(
    1,
    limit - eventSlots - placeSlots - merchantSlots - showcaseProductSlots - grocerySlots,
  );

  const showcase = (await ctx.runQuery(internal.platform.feed._buildShowcaseFeed, {
    eventLimit: eventSlots + 4,
    placeLimit: placeSlots + 3,
    merchantLimit: merchantSlots + 2,
    showcaseProductLimit: showcaseProductSlots + 4,
    groceryLimit: grocerySlots + 2,
    postLimit: postSlots + 2,
    discoverCategorySlug: args.discoverCategorySlug,
  })) as FeedCard[];

  if (!hasPersonalization || !profile?.embedding) {
    let feed = buildGuestFeed(showcase, limit, dailySeed);
    if (feed.length === 0 && showcase.length > 0) {
      feed = shuffleWithSeed(showcase, dailySeed)
        .slice(0, limit)
        .map((c) => ({ ...c, personalized: false }));
    }
    return feed;
  }

  const tastePool = await buildTastePool(ctx, profile.embedding, limit);

  if (tastePool.length === 0) {
    let feed = buildGuestFeed(showcase, limit, dailySeed);
    if (feed.length === 0 && showcase.length > 0) {
      feed = shuffleWithSeed(showcase, dailySeed)
        .slice(0, limit)
        .map((c) => ({ ...c, personalized: false }));
    }
    return feed;
  }

  const explorePool = shuffleWithSeed(showcase, dailySeed + 7);

  let { feed } = composeDiscoveryFeed(tastePool, explorePool, limit);

  if (feed.length === 0 && showcase.length > 0) {
    return buildGuestFeed(showcase, limit, dailySeed);
  }

  const minExplore = Math.ceil(limit * 0.35);
  let exploreCount = feed.filter((c) => !c.personalized).length;
  if (exploreCount < minExplore) {
    const seen = new Set(feed.map(cardKey));
    for (const card of shuffleWithSeed(showcase, dailySeed + 11)) {
      if (feed.length >= limit && exploreCount >= minExplore) break;
      const key = cardKey(card);
      if (seen.has(key)) continue;
      seen.add(key);
      feed.push({ ...card, personalized: false });
      exploreCount += 1;
    }
  }

  if (feed.length < limit) {
    const seen = new Set(feed.map(cardKey));
    for (const card of shuffleWithSeed(showcase, dailySeed + 9)) {
      if (feed.length >= limit) break;
      const key = cardKey(card);
      if (seen.has(key)) continue;
      seen.add(key);
      feed.push({ ...card, personalized: false });
    }
  }

  return feed.slice(0, limit);
}

const feedMetaValidator = v.object({
  tasteSlots: v.number(),
  exploreSlots: v.number(),
  categorySpread: v.record(v.string(), v.number()),
  entityTypeSpread: v.record(v.string(), v.number()),
});

const feedResponseValidator = v.object({
  items: v.array(feedCardValidator),
  meta: feedMetaValidator,
});

export const getPersonalizedFeed = action({
  args: {
    limit: v.optional(v.number()),
  },
  returns: feedResponseValidator,
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 40);
    const feed = await composeFeed(ctx, { limit });
    const tasteSlots = feed.filter((c) => c.personalized).length;
    const exploreSlots = feed.length - tasteSlots;
    const { categorySpread, entityTypeSpread } = computeSpread(feed);
    return {
      items: feed,
      meta: { tasteSlots, exploreSlots, categorySpread, entityTypeSpread },
    };
  },
});

export const getDiscoverFeed = action({
  args: {
    categorySlug: v.string(),
    limit: v.optional(v.number()),
  },
  returns: feedResponseValidator,
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 40);
    const feed = await composeFeed(ctx, {
      limit,
      discoverCategorySlug: args.categorySlug,
    });
    const tasteSlots = feed.filter((c) => c.personalized).length;
    const exploreSlots = feed.length - tasteSlots;
    const { categorySpread, entityTypeSpread } = computeSpread(feed);
    return {
      items: feed,
      meta: { tasteSlots, exploreSlots, categorySpread, entityTypeSpread },
    };
  },
});
