import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  avatarFor,
  buildMediaFromStorage,
  feedCardValidator,
  type FeedCard,
} from "./feedMedia";

async function merchantIdentity(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  merchant: Doc<"merchants"> | null,
  fallbackSlug?: string,
): Promise<{ profileName: string; profileAvatar: string | null; merchantSlug?: string }> {
  if (!merchant) {
    return {
      profileName: fallbackSlug ?? "AUX",
      profileAvatar: fallbackSlug ? avatarFor(fallbackSlug) : null,
      merchantSlug: fallbackSlug,
    };
  }
  const logoUrl = merchant.logoStorageId
    ? await ctx.storage.getUrl(merchant.logoStorageId)
    : null;
  return {
    profileName: merchant.name,
    profileAvatar: logoUrl ?? avatarFor(merchant.slug),
    merchantSlug: merchant.slug,
  };
}

function categoriesFor(doc: {
  feedCategories?: string[];
}): string[] {
  return doc.feedCategories?.length ? doc.feedCategories : ["Discover"];
}

export function matchesDiscoverCategorySlug(
  doc: {
    discoverCategorySlugs?: string[];
    feedCategories?: string[];
  },
  categorySlug: string,
): boolean {
  if (doc.discoverCategorySlugs?.includes(categorySlug)) {
    return true;
  }
  const slugToLabel: Record<string, string> = {
    "beach-bars": "Beach bars",
    "cost-effective": "Cost-effective",
    sundowners: "Sundowners",
    cafes: "Cafes",
    romantic: "Romantic",
    "night-clubs": "Night clubs",
    "wine-bars": "Wine bars",
    vegetarian: "Vegetarian",
    "dive-bar": "Dive bar",
    "on-the-coast": "On the coast",
  };
  const label = slugToLabel[categorySlug];
  if (label && doc.feedCategories?.includes(label)) {
    return true;
  }
  return false;
}

async function productToFeedCard(
  ctx: Parameters<typeof buildMediaFromStorage>[0],
  product: Doc<"products"> & { imageUrl?: string | null },
  merchant: Doc<"merchants"> | null,
  personalized: boolean,
  score?: number,
): Promise<FeedCard> {
  const identity = await merchantIdentity(ctx, merchant, merchant?.slug);
  const media = await buildMediaFromStorage(ctx, {
    primaryId: product.imageStorageId,
    mediaAspect: product.mediaAspect,
    imageWidth: product.imageWidth,
    imageHeight: product.imageHeight,
    fallbackUrl: product.imageUrl ?? null,
  });

  return {
    kind: "product",
    contentType: "product",
    id: product._id,
    title: product.name,
    subtitle: merchant?.tagline ?? merchant?.name,
    description: product.description,
    media,
    badge: product.feedBadge,
    profileName: identity.profileName,
    profileAvatar: identity.profileAvatar,
    merchantSlug: identity.merchantSlug,
    productSlug: product.slug,
    businessId: identity.merchantSlug,
    categories: categoriesFor(product),
    verified: personalized,
    personalized,
    score,
  };
}

async function merchantToFeedCard(
  ctx: Parameters<typeof buildMediaFromStorage>[0],
  merchant: Doc<"merchants">,
  personalized: boolean,
  score?: number,
): Promise<FeedCard> {
  const identity = await merchantIdentity(ctx, merchant);
  const media = await buildMediaFromStorage(ctx, {
    primaryId: merchant.coverStorageId ?? merchant.logoStorageId,
    galleryIds: merchant.galleryStorageIds,
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
  });

  return {
    kind: "merchant",
    contentType: "place",
    id: merchant._id,
    title: merchant.name,
    subtitle: merchant.tagline,
    description: merchant.description,
    media,
    badge: merchant.feedBadge,
    status: merchant.operatingStatus,
    profileName: identity.profileName,
    profileAvatar: identity.profileAvatar,
    merchantSlug: merchant.slug,
    businessId: merchant.slug,
    categories: categoriesFor(merchant),
    verified: true,
    personalized,
    score,
  };
}

async function placeToFeedCard(
  ctx: Parameters<typeof buildMediaFromStorage>[0],
  place: Doc<"places">,
  merchant: Doc<"merchants"> | null,
  personalized: boolean,
): Promise<FeedCard> {
  const identity = await merchantIdentity(ctx, merchant, place.slug);
  const media = await buildMediaFromStorage(ctx, {
    primaryId: place.coverStorageId,
    galleryIds: place.galleryStorageIds,
    mediaAspect: place.mediaAspect,
    imageWidth: place.imageWidth,
    imageHeight: place.imageHeight,
  });

  return {
    kind: "place",
    contentType: "place",
    id: place._id,
    title: place.name,
    subtitle: merchant?.tagline ?? place.placeKind,
    description: place.description,
    media,
    badge: place.feedBadge,
    status: place.operatingStatus,
    profileName: merchant?.name ?? place.name,
    profileAvatar: identity.profileAvatar,
    merchantSlug: merchant?.slug,
    businessId: merchant?.slug ?? place.slug,
    categories: categoriesFor(place),
    verified: true,
    personalized,
  };
}

async function eventToFeedCard(
  ctx: Parameters<typeof buildMediaFromStorage>[0],
  event: Doc<"events">,
  merchant: Doc<"merchants"> | null,
  personalized: boolean,
): Promise<FeedCard> {
  const identity = await merchantIdentity(ctx, merchant);
  const media = await buildMediaFromStorage(ctx, {
    primaryId: event.imageStorageId,
    galleryIds: event.galleryStorageIds,
    mediaAspect: event.mediaAspect,
    imageWidth: event.imageWidth,
    imageHeight: event.imageHeight,
  });

  return {
    kind: "event",
    contentType: "event",
    id: event._id,
    title: event.name,
    subtitle: event.location,
    description: event.description,
    media,
    badge: event.feedBadge ?? { label: "UPCOMING EVENT", color: "#E91E63" },
    status: "upcoming",
    chyron: event.chyron,
    profileName: identity.profileName,
    profileAvatar: identity.profileAvatar,
    merchantSlug: identity.merchantSlug,
    businessId: identity.merchantSlug,
    categories: categoriesFor(event),
    verified: true,
    personalized,
  };
}

async function postToFeedCard(
  ctx: Parameters<typeof buildMediaFromStorage>[0],
  post: Doc<"posts">,
  merchant: Doc<"merchants"> | null,
  personalized: boolean,
): Promise<FeedCard> {
  const identity = await merchantIdentity(ctx, merchant);
  const media = await buildMediaFromStorage(ctx, {
    primaryId: post.imageStorageId,
    galleryIds: post.galleryStorageIds,
    mediaAspect: post.mediaAspect,
    imageWidth: post.imageWidth,
    imageHeight: post.imageHeight,
  });

  return {
    kind: "post",
    contentType: "post",
    id: post._id,
    title: post.title,
    subtitle: post.subtitle,
    description: post.caption,
    media,
    badge: post.feedBadge,
    status: post.operatingStatus,
    profileName: identity.profileName,
    profileAvatar: identity.profileAvatar,
    merchantSlug: identity.merchantSlug,
    businessId: identity.merchantSlug,
    categories: categoriesFor(post),
    verified: true,
    personalized,
  };
}

export const _buildShowcaseFeed = internalQuery({
  args: {
    eventLimit: v.number(),
    placeLimit: v.number(),
    merchantLimit: v.number(),
    showcaseProductLimit: v.number(),
    groceryLimit: v.number(),
    postLimit: v.number(),
    discoverCategorySlug: v.optional(v.string()),
  },
  returns: v.array(feedCardValidator),
  handler: async (ctx, args) => {
    const now = Date.now();
    const cards: FeedCard[] = [];
    const seen = new Set<string>();
    const categorySlug = args.discoverCategorySlug;

    const push = (card: FeedCard) => {
      const key = `${card.kind}:${card.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      cards.push(card);
    };

    const matchesCategory = (doc: {
      discoverCategorySlugs?: string[];
      feedCategories?: string[];
    }) =>
      categorySlug === undefined || matchesDiscoverCategorySlug(doc, categorySlug);

    const events = await ctx.db
      .query("events")
      .withIndex("by_startTime")
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), now),
          q.or(
            q.eq(q.field("isCancelled"), undefined),
            q.eq(q.field("isCancelled"), false),
          ),
        ),
      )
      .take(args.eventLimit * 4);

    for (const event of events) {
      if (!matchesCategory(event)) continue;
      if (cards.filter((c) => c.kind === "event").length >= args.eventLimit) break;
      const merchant = await ctx.db.get(event.merchantId);
      push(await eventToFeedCard(ctx, event, merchant, false));
    }

    const places = await ctx.db
      .query("places")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(args.placeLimit * 4);

    for (const place of places) {
      if (!matchesCategory(place)) continue;
      if (cards.filter((c) => c.kind === "place").length >= args.placeLimit) break;
      const merchant = place.linkedMerchantId
        ? await ctx.db.get(place.linkedMerchantId)
        : null;
      push(await placeToFeedCard(ctx, place, merchant, false));
    }

    const merchants = await ctx.db
      .query("merchants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(args.merchantLimit * 4);

    for (const merchant of merchants) {
      if (!matchesCategory(merchant)) continue;
      if (merchant.type === "retail" && merchant.slug === "ycago-grocery") continue;
      if (cards.filter((c) => c.kind === "merchant").length >= args.merchantLimit) break;
      if (merchant.coverStorageId || merchant.galleryStorageIds?.length) {
        push(await merchantToFeedCard(ctx, merchant, false));
      }
    }

    const menuProducts = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(200);

    const showcaseProducts = menuProducts.filter(
      (p) => p.productKind === "menu" || p.feedBadge !== undefined,
    );
    for (const product of showcaseProducts) {
      if (!matchesCategory(product)) continue;
      if (cards.filter((c) => c.kind === "product" && c.merchantSlug !== "ycago-grocery").length >= args.showcaseProductLimit) break;
      const merchant = product.merchantId ? await ctx.db.get(product.merchantId) : null;
      push(
        await productToFeedCard(
          ctx,
          {
            ...product,
            imageUrl: product.imageStorageId
              ? await ctx.storage.getUrl(product.imageStorageId)
              : null,
          },
          merchant,
          false,
        ),
      );
    }

    const groceryHighlights = await ctx.db
      .query("products")
      .withIndex("by_feed_highlight", (q) =>
        q.eq("feedHighlight", true).eq("isActive", true),
      )
      .take(args.groceryLimit * 4);

    for (const product of groceryHighlights) {
      if (!matchesCategory(product)) continue;
      if (cards.filter((c) => c.kind === "product" && c.merchantSlug === "ycago-grocery").length >= args.groceryLimit) break;
      const merchant = product.merchantId ? await ctx.db.get(product.merchantId) : null;
      push(
        await productToFeedCard(
          ctx,
          {
            ...product,
            imageUrl: product.imageStorageId
              ? await ctx.storage.getUrl(product.imageStorageId)
              : null,
          },
          merchant,
          false,
        ),
      );
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(args.postLimit * 4);

    for (const post of posts) {
      if (!matchesCategory(post)) continue;
      if (cards.filter((c) => c.kind === "post").length >= args.postLimit) break;
      const merchant = await ctx.db.get(post.merchantId);
      push(await postToFeedCard(ctx, post, merchant, false));
    }

    return cards;
  },
});

export const _hydrateProductCards = internalQuery({
  args: {
    ids: v.array(v.id("products")),
    personalized: v.boolean(),
    scores: v.optional(v.array(v.object({ id: v.id("products"), score: v.number() }))),
  },
  returns: v.array(feedCardValidator),
  handler: async (ctx, args) => {
    const scoreMap = new Map(
      (args.scores ?? []).map((entry) => [entry.id, entry.score]),
    );
    const cards: FeedCard[] = [];
    for (const id of args.ids) {
      const product = await ctx.db.get(id);
      if (!product || !product.isActive) continue;
      const merchant = product.merchantId ? await ctx.db.get(product.merchantId) : null;
      cards.push(
        await productToFeedCard(
          ctx,
          {
            ...product,
            imageUrl: product.imageStorageId
              ? await ctx.storage.getUrl(product.imageStorageId)
              : null,
          },
          merchant,
          args.personalized,
          scoreMap.get(id),
        ),
      );
    }
    return cards;
  },
});

export const _hydrateMerchantCards = internalQuery({
  args: {
    ids: v.array(v.id("merchants")),
    personalized: v.boolean(),
    scores: v.optional(v.array(v.object({ id: v.id("merchants"), score: v.number() }))),
  },
  returns: v.array(feedCardValidator),
  handler: async (ctx, args) => {
    const scoreMap = new Map(
      (args.scores ?? []).map((entry) => [entry.id, entry.score]),
    );
    const cards: FeedCard[] = [];
    for (const id of args.ids) {
      const merchant = await ctx.db.get(id);
      if (!merchant || !merchant.isActive) continue;
      cards.push(
        await merchantToFeedCard(ctx, merchant, args.personalized, scoreMap.get(id)),
      );
    }
    return cards;
  },
});
