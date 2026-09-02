import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type MediaAspect =
  | "square"
  | "portrait45"
  | "portrait34"
  | "landscape"
  | "story";

const DISCOVER_TILES = [
  {
    slug: "beach-bars",
    name: "Beach bars",
    tileColor: "#C62828",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
    sortOrder: 10,
  },
  {
    slug: "cost-effective",
    name: "Cost-effective",
    tileColor: "#2E7D32",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
    sortOrder: 20,
  },
  {
    slug: "sundowners",
    name: "Sundowners",
    tileColor: "#E65100",
    imageUrl:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80",
    sortOrder: 30,
  },
  {
    slug: "cafes",
    name: "Cafes",
    tileColor: "#AD1457",
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80",
    sortOrder: 40,
  },
  {
    slug: "romantic",
    name: "Romantic",
    tileColor: "#4E342E",
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    sortOrder: 50,
  },
  {
    slug: "night-clubs",
    name: "Night clubs",
    tileColor: "#1565C0",
    imageUrl:
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=80",
    sortOrder: 60,
  },
  {
    slug: "wine-bars",
    name: "Wine bars",
    tileColor: "#6A1B9A",
    imageUrl:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
    sortOrder: 70,
  },
  {
    slug: "vegetarian",
    name: "Vegetarian",
    tileColor: "#EF6C00",
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
    sortOrder: 80,
  },
  {
    slug: "dive-bar",
    name: "Dive bar",
    tileColor: "#37474F",
    imageUrl:
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&q=80",
    sortOrder: 90,
  },
  {
    slug: "on-the-coast",
    name: "On the coast",
    tileColor: "#00695C",
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80",
    sortOrder: 100,
  },
] as const;

const FEED_LABEL_TO_DISCOVER_SLUG: Record<string, string> = {
  "Beach bars": "beach-bars",
  "Cost-effective": "cost-effective",
  Sundowners: "sundowners",
  Cafes: "cafes",
  Romantic: "romantic",
  "Night clubs": "night-clubs",
  "Wine bars": "wine-bars",
  Vegetarian: "vegetarian",
  "Dive bar": "dive-bar",
  "On the coast": "on-the-coast",
};

function discoverSlugsFor(
  feedCategories: string[],
  extra: string[] = [],
): string[] {
  const fromLabels = feedCategories
    .map((label) => FEED_LABEL_TO_DISCOVER_SLUG[label])
    .filter((slug): slug is string => slug !== undefined);
  return [...new Set([...fromLabels, ...extra])];
}

const GROCERY_HIGHLIGHTS: Array<{
  slug: string;
  mediaAspect: MediaAspect;
  imageWidth: number;
  imageHeight: number;
  feedBadge?: { label: string; color: string };
  feedCategories: string[];
  discoverCategorySlugs?: string[];
}> = [
  {
    slug: "sourdough-loaf",
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
    feedBadge: { label: "FEATURED", color: "#7C4DFF" },
    feedCategories: ["Bakery", "Discover"],
    discoverCategorySlugs: ["cost-effective"],
  },
  {
    slug: "avocado",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
    feedCategories: ["Fresh Produce", "Vegetarian"],
    discoverCategorySlugs: ["vegetarian", "cost-effective"],
  },
  {
    slug: "cold-brew-coffee-250ml",
    mediaAspect: "story",
    imageWidth: 1080,
    imageHeight: 1920,
    feedBadge: { label: "NEW", color: "#00BFA5" },
    feedCategories: ["Drinks", "Cafes"],
    discoverCategorySlugs: ["cafes"],
  },
  {
    slug: "vine-tomatoes-500g",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 608,
    feedCategories: ["Fresh Produce", "Cost-effective"],
    discoverCategorySlugs: ["cost-effective", "vegetarian"],
  },
  {
    slug: "greek-yoghurt-500g",
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
    feedCategories: ["Dairy & Eggs", "Discover"],
    discoverCategorySlugs: ["cost-effective"],
  },
  {
    slug: "butter-croissants-4pk",
    mediaAspect: "portrait34",
    imageWidth: 1080,
    imageHeight: 1440,
    feedBadge: { label: "FEATURED", color: "#FF6F00" },
    feedCategories: ["Bakery", "Sundowners"],
    discoverCategorySlugs: ["sundowners", "cafes"],
  },
];

const LA_PARADA_UNSPLASH: Record<
  string,
  { url: string; mediaAspect: MediaAspect; imageWidth: number; imageHeight: number }
> = {
  "patatas-bravas": {
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&q=80",
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
  },
  "gambas-al-ajillo": {
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&q=80",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
  },
  "paella-valenciana": {
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&q=80",
    mediaAspect: "portrait34",
    imageWidth: 1080,
    imageHeight: 1440,
  },
  "sangria-de-la-casa": {
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1080&q=80",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 608,
  },
  "croquetas-jamon": {
    url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=1080&q=80",
    mediaAspect: "story",
    imageWidth: 1080,
    imageHeight: 1920,
  },
};

const EVENT_UNSPLASH: Record<
  string,
  {
    url: string;
    mediaAspect: MediaAspect;
    imageWidth: number;
    imageHeight: number;
    chyron?: string;
    feedBadge?: { label: string; color: string };
    feedCategories: string[];
    galleryUrls?: string[];
  }
> = {
  "keinemusik-cape-town": {
    url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1080&q=80",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 608,
    chyron: "Keinemusik crew is coming to Cape Town & JHB this Nov!",
    feedBadge: { label: "NEW EVENT", color: "#00BFA5" },
    feedCategories: ["Events", "Music", "Night clubs"],
    galleryUrls: [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1080&q=80",
    ],
  },
  "afropunk-joburg-2026": {
    url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1080&q=80",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 608,
    chyron: "Afropunk returns to Johannesburg for the biggest edition yet",
    feedBadge: { label: "EARLY BIRD", color: "#E91E63" },
    feedCategories: ["Events", "Music"],
  },
  "jerk-x-jollof-accra": {
    url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1080&q=80",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
    chyron: "Three of the hottest new places & events in your city",
    feedBadge: { label: "UPCOMING EVENT", color: "#E91E63" },
    feedCategories: ["Events", "Food & Drink"],
    galleryUrls: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1080&q=80",
    ],
  },
};

async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status} for ${url}`);
  }
  return await res.blob();
}

export const _getCategoryIdBySlug = internalQuery({
  args: { slug: v.string() },
  returns: v.union(v.id("categories"), v.null()),
  handler: async (ctx, args) => {
    const cat = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return cat?._id ?? null;
  },
});

export const _applyShowcaseData = internalMutation({
  args: {
    ownerUserId: v.id("users"),
    discoverImages: v.array(
      v.object({ slug: v.string(), imageStorageId: v.id("_storage") }),
    ),
    merchantImages: v.array(
      v.object({
        slug: v.string(),
        logoStorageId: v.optional(v.id("_storage")),
        coverStorageId: v.optional(v.id("_storage")),
        galleryStorageIds: v.optional(v.array(v.id("_storage"))),
      }),
    ),
    placeImages: v.array(
      v.object({
        slug: v.string(),
        coverStorageId: v.optional(v.id("_storage")),
        galleryStorageIds: v.optional(v.array(v.id("_storage"))),
        mediaAspect: v.optional(
          v.union(
            v.literal("square"),
            v.literal("portrait45"),
            v.literal("portrait34"),
            v.literal("landscape"),
            v.literal("story"),
          ),
        ),
        imageWidth: v.optional(v.number()),
        imageHeight: v.optional(v.number()),
      }),
    ),
    productImages: v.array(
      v.object({
        slug: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        mediaAspect: v.optional(
          v.union(
            v.literal("square"),
            v.literal("portrait45"),
            v.literal("portrait34"),
            v.literal("landscape"),
            v.literal("story"),
          ),
        ),
        imageWidth: v.optional(v.number()),
        imageHeight: v.optional(v.number()),
      }),
    ),
    eventImages: v.array(
      v.object({
        slug: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        galleryStorageIds: v.optional(v.array(v.id("_storage"))),
        mediaAspect: v.optional(
          v.union(
            v.literal("square"),
            v.literal("portrait45"),
            v.literal("portrait34"),
            v.literal("landscape"),
            v.literal("story"),
          ),
        ),
        imageWidth: v.optional(v.number()),
        imageHeight: v.optional(v.number()),
      }),
    ),
    postImages: v.array(
      v.object({
        slug: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        galleryStorageIds: v.optional(v.array(v.id("_storage"))),
        mediaAspect: v.optional(
          v.union(
            v.literal("square"),
            v.literal("portrait45"),
            v.literal("portrait34"),
            v.literal("landscape"),
            v.literal("story"),
          ),
        ),
        imageWidth: v.optional(v.number()),
        imageHeight: v.optional(v.number()),
      }),
    ),
  },
  returns: v.object({
    discoverTiles: v.number(),
    merchantsUpserted: v.number(),
    placesUpserted: v.number(),
    eventsUpserted: v.number(),
    productsUpdated: v.number(),
    postsUpserted: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let discoverTiles = 0;
    let merchantsUpserted = 0;
    let placesUpserted = 0;
    let eventsUpserted = 0;
    let productsUpdated = 0;
    let postsUpserted = 0;

    const discoverImageMap = new Map(
      args.discoverImages.map((d) => [d.slug, d.imageStorageId]),
    );

    for (const tile of DISCOVER_TILES) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", tile.slug))
        .unique();
      const imageStorageId = discoverImageMap.get(tile.slug);
      if (existing === null) {
        await ctx.db.insert("categories", {
          name: tile.name,
          slug: tile.slug,
          sortOrder: tile.sortOrder,
          tileColor: tile.tileColor,
          showOnDiscoverHome: true,
          discoverGroup: "Discover",
          imageStorageId,
        });
      } else {
        await ctx.db.patch(existing._id, {
          name: tile.name,
          tileColor: tile.tileColor,
          showOnDiscoverHome: true,
          discoverGroup: "Discover",
          sortOrder: tile.sortOrder,
          ...(imageStorageId ? { imageStorageId } : {}),
        });
      }
      discoverTiles += 1;
    }

    const slugToMerchantId = new Map<string, Id<"merchants">>();
    const merchants = await ctx.db.query("merchants").take(100);
    for (const m of merchants) slugToMerchantId.set(m.slug, m._id);

    async function ensureMerchant(seed: {
      slug: string;
      name: string;
      tagline: string;
      type: "restaurant" | "retail" | "event_organizer" | "other";
      description: string;
      location?: { address: string; lat?: number; lng?: number };
      feedCategories: string[];
      discoverCategorySlugs?: string[];
      feedBadge?: { label: string; color: string };
      operatingStatus?: "open" | "closed" | "upcoming" | "live";
      linkedPlaceSlug?: string;
    }) {
      let merchantId = slugToMerchantId.get(seed.slug);
      const images = args.merchantImages.find((m) => m.slug === seed.slug);
      const discoverCategorySlugs =
        seed.discoverCategorySlugs ?? discoverSlugsFor(seed.feedCategories);

      if (!merchantId) {
        merchantId = await ctx.db.insert("merchants", {
          ownerUserId: args.ownerUserId,
          slug: seed.slug,
          name: seed.name,
          tagline: seed.tagline,
          type: seed.type,
          description: seed.description,
          location: seed.location,
          feedCategories: seed.feedCategories,
          discoverCategorySlugs,
          feedBadge: seed.feedBadge,
          operatingStatus: seed.operatingStatus,
          logoStorageId: images?.logoStorageId,
          coverStorageId: images?.coverStorageId,
          galleryStorageIds: images?.galleryStorageIds,
          isActive: true,
          createdAt: now,
        });
        slugToMerchantId.set(seed.slug, merchantId);
        merchantsUpserted += 1;
      } else {
        await ctx.db.patch(merchantId, {
          tagline: seed.tagline,
          description: seed.description,
          location: seed.location,
          feedCategories: seed.feedCategories,
          discoverCategorySlugs,
          feedBadge: seed.feedBadge,
          operatingStatus: seed.operatingStatus,
          ...(images?.logoStorageId ? { logoStorageId: images.logoStorageId } : {}),
          ...(images?.coverStorageId ? { coverStorageId: images.coverStorageId } : {}),
          ...(images?.galleryStorageIds
            ? { galleryStorageIds: images.galleryStorageIds }
            : {}),
        });
        merchantsUpserted += 1;
      }
      return merchantId;
    }

    await ensureMerchant({
      slug: "la-parada",
      name: "La Parada",
      tagline: "Bar de Tapas",
      type: "restaurant",
      description:
        "Authentic Spanish tapas bar in the heart of Cape Town. Craft cocktails, live music, and waterfront energy.",
      location: { address: "Cape Town, South Africa" },
      feedCategories: ["Restaurants", "Sundowners", "Wine bars"],
      discoverCategorySlugs: ["sundowners", "wine-bars", "romantic"],
      operatingStatus: "open",
    });

    const laParadaImages = args.merchantImages.find((m) => m.slug === "la-parada");
    if (laParadaImages && slugToMerchantId.get("la-parada")) {
      await ctx.db.patch(slugToMerchantId.get("la-parada")!, {
        logoStorageId: laParadaImages.logoStorageId,
        coverStorageId: laParadaImages.coverStorageId,
        galleryStorageIds: laParadaImages.galleryStorageIds,
      });
    }

    await ensureMerchant({
      slug: "sbcltr",
      name: "SBCLTR",
      tagline: "Bar & Lounge",
      type: "restaurant",
      description:
        "A subculture-inspired cocktail bar in the heart of Cape Town. Craft cocktails, vinyl nights, and curated small plates.",
      location: { address: "Cape Town, South Africa" },
      feedCategories: ["Bars", "Night clubs", "Wine bars"],
      discoverCategorySlugs: ["night-clubs", "wine-bars", "dive-bar"],
      feedBadge: { label: "NEW PLACE", color: "#00BFA5" },
      operatingStatus: "open",
      linkedPlaceSlug: "sbcltr-venue",
    });

    await ensureMerchant({
      slug: "himatsu-studio",
      name: "Himatsu Studio",
      tagline: "Streetwear",
      type: "retail",
      description:
        "Limited-edition capsule collection featuring bold prints and relaxed fits. Available for pre-order exclusively on AUX.",
      feedCategories: ["Products", "Fashion"],
    });

    await ensureMerchant({
      slug: "the-lawns",
      name: "The Lawns",
      tagline: "Restaurant & Garden",
      type: "restaurant",
      description:
        "An open-air dining destination perfect for sundowners and weekend brunches. Farm-to-table menu with seasonal specials.",
      location: { address: "Cape Town, South Africa" },
      feedCategories: ["Restaurants", "Sundowners", "Romantic"],
      discoverCategorySlugs: ["sundowners", "romantic", "on-the-coast"],
      operatingStatus: "open",
      linkedPlaceSlug: "the-lawns-venue",
    });

    await ensureMerchant({
      slug: "shimmy-beach-club",
      name: "Shimmy Beach Club",
      tagline: "Beach club highlights",
      type: "restaurant",
      description:
        "Catch the sunset with live DJs every Friday and Saturday. Cabanas, frozen cocktails, and good energy all weekend long.",
      location: { address: "Cape Town, South Africa" },
      feedCategories: ["Beach bars", "Events", "Sundowners"],
      discoverCategorySlugs: ["beach-bars", "sundowners", "on-the-coast"],
      operatingStatus: "open",
    });

    await ensureMerchant({
      slug: "jerk-x-jollof",
      name: "JERKXJOLLOF ACCRA",
      tagline: "Deep house event",
      type: "event_organizer",
      description:
        "The ultimate Afro-Caribbean food and music experience. Hosted by Kojo Manuel with Front & Back, Wild Turkey, and Ghetto Golf.",
      location: { address: "Accra, Ghana" },
      feedCategories: ["Events", "Food & Drink"],
    });

    const slugToPlaceId = new Map<string, Id<"places">>();
    const places = await ctx.db.query("places").take(100);
    for (const p of places) slugToPlaceId.set(p.slug, p._id);

    async function ensurePlace(seed: {
      slug: string;
      name: string;
      description: string;
      placeKind: "venue" | "other";
      location?: { address: string };
      linkedMerchantSlug?: string;
      feedCategories: string[];
      discoverCategorySlugs?: string[];
      feedBadge?: { label: string; color: string };
      operatingStatus?: "open" | "closed" | "upcoming" | "live";
    }) {
      const images = args.placeImages.find((p) => p.slug === seed.slug);
      const linkedMerchantId = seed.linkedMerchantSlug
        ? slugToMerchantId.get(seed.linkedMerchantSlug)
        : undefined;
      let placeId = slugToPlaceId.get(seed.slug);
      const discoverCategorySlugs =
        seed.discoverCategorySlugs ?? discoverSlugsFor(seed.feedCategories);

      if (!placeId) {
        placeId = await ctx.db.insert("places", {
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
          location: seed.location,
          placeKind: seed.placeKind,
          linkedMerchantId,
          ownerUserId: args.ownerUserId,
          feedCategories: seed.feedCategories,
          discoverCategorySlugs,
          feedBadge: seed.feedBadge,
          operatingStatus: seed.operatingStatus,
          coverStorageId: images?.coverStorageId,
          galleryStorageIds: images?.galleryStorageIds,
          mediaAspect: images?.mediaAspect,
          imageWidth: images?.imageWidth,
          imageHeight: images?.imageHeight,
          isActive: true,
          createdAt: now,
        });
        slugToPlaceId.set(seed.slug, placeId);
        placesUpserted += 1;
      } else {
        await ctx.db.patch(placeId, {
          description: seed.description,
          feedCategories: seed.feedCategories,
          discoverCategorySlugs,
          feedBadge: seed.feedBadge,
          operatingStatus: seed.operatingStatus,
          linkedMerchantId,
          ...(images?.coverStorageId ? { coverStorageId: images.coverStorageId } : {}),
          ...(images?.galleryStorageIds
            ? { galleryStorageIds: images.galleryStorageIds }
            : {}),
          ...(images?.mediaAspect ? { mediaAspect: images.mediaAspect } : {}),
          ...(images?.imageWidth ? { imageWidth: images.imageWidth } : {}),
          ...(images?.imageHeight ? { imageHeight: images.imageHeight } : {}),
        });
        placesUpserted += 1;
      }
      return placeId;
    }

    await ensurePlace({
      slug: "sbcltr-venue",
      name: "SBCLTR",
      description: "Subculture cocktail bar and lounge in Cape Town CBD.",
      placeKind: "venue",
      location: { address: "Cape Town, South Africa" },
      linkedMerchantSlug: "sbcltr",
      feedCategories: ["Bars", "Night clubs"],
      discoverCategorySlugs: ["night-clubs", "wine-bars"],
      feedBadge: { label: "NEW PLACE", color: "#00BFA5" },
      operatingStatus: "open",
    });

    await ensurePlace({
      slug: "the-lawns-venue",
      name: "The Lawns",
      description: "Open-air garden restaurant and sundowner destination.",
      placeKind: "venue",
      location: { address: "Cape Town, South Africa" },
      linkedMerchantSlug: "the-lawns",
      feedCategories: ["Restaurants", "Sundowners"],
      discoverCategorySlugs: ["sundowners", "romantic", "on-the-coast"],
      operatingStatus: "open",
    });

    await ensurePlace({
      slug: "orphanage-cpt",
      name: "Orphanage Cocktail Emporium",
      description:
        "Hidden behind an unmarked door in the city centre. Award-winning mixologists, dim lighting, and jazz on vinyl.",
      placeKind: "venue",
      location: { address: "Cape Town, South Africa" },
      feedCategories: ["Bars", "Romantic", "Dive bar"],
      discoverCategorySlugs: ["dive-bar", "romantic", "wine-bars"],
      operatingStatus: "closed",
    });

    for (const productImage of args.productImages) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", productImage.slug))
        .unique();
      if (!product) continue;
      const highlight = GROCERY_HIGHLIGHTS.find((g) => g.slug === productImage.slug);
      const laParadaMeta = LA_PARADA_UNSPLASH[productImage.slug];
      await ctx.db.patch(product._id, {
        ...(productImage.imageStorageId
          ? { imageStorageId: productImage.imageStorageId }
          : {}),
        ...(productImage.mediaAspect ? { mediaAspect: productImage.mediaAspect } : {}),
        ...(productImage.imageWidth ? { imageWidth: productImage.imageWidth } : {}),
        ...(productImage.imageHeight ? { imageHeight: productImage.imageHeight } : {}),
        ...(highlight
          ? {
              feedHighlight: true,
              feedBadge: highlight.feedBadge,
              feedCategories: highlight.feedCategories,
              discoverCategorySlugs: highlight.discoverCategorySlugs,
              mediaAspect: highlight.mediaAspect,
              imageWidth: highlight.imageWidth,
              imageHeight: highlight.imageHeight,
            }
          : {}),
        ...(laParadaMeta && !highlight
          ? {
              feedCategories: ["Restaurants", "Tapas"],
              mediaAspect: laParadaMeta.mediaAspect,
              imageWidth: laParadaMeta.imageWidth,
              imageHeight: laParadaMeta.imageHeight,
            }
          : {}),
      });
      productsUpdated += 1;
    }

    for (const highlight of GROCERY_HIGHLIGHTS) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", highlight.slug))
        .unique();
      if (!product) continue;
      await ctx.db.patch(product._id, {
        feedHighlight: true,
        feedBadge: highlight.feedBadge,
        feedCategories: highlight.feedCategories,
        discoverCategorySlugs: highlight.discoverCategorySlugs,
        mediaAspect: highlight.mediaAspect,
        imageWidth: highlight.imageWidth,
        imageHeight: highlight.imageHeight,
      });
      productsUpdated += 1;
    }

    for (const placeImage of args.placeImages) {
      const place = await ctx.db
        .query("places")
        .withIndex("by_slug", (q) => q.eq("slug", placeImage.slug))
        .unique();
      if (!place) continue;
      await ctx.db.patch(place._id, {
        ...(placeImage.coverStorageId ? { coverStorageId: placeImage.coverStorageId } : {}),
        ...(placeImage.galleryStorageIds
          ? { galleryStorageIds: placeImage.galleryStorageIds }
          : {}),
        ...(placeImage.mediaAspect ? { mediaAspect: placeImage.mediaAspect } : {}),
        ...(placeImage.imageWidth ? { imageWidth: placeImage.imageWidth } : {}),
        ...(placeImage.imageHeight ? { imageHeight: placeImage.imageHeight } : {}),
      });
    }

    for (const merchantImage of args.merchantImages) {
      const merchantId = slugToMerchantId.get(merchantImage.slug);
      if (!merchantId) continue;
      await ctx.db.patch(merchantId, {
        ...(merchantImage.logoStorageId ? { logoStorageId: merchantImage.logoStorageId } : {}),
        ...(merchantImage.coverStorageId ? { coverStorageId: merchantImage.coverStorageId } : {}),
        ...(merchantImage.galleryStorageIds
          ? { galleryStorageIds: merchantImage.galleryStorageIds }
          : {}),
      });
    }

    for (const [eventSlug, meta] of Object.entries(EVENT_UNSPLASH)) {
      const images = args.eventImages.find((e) => e.slug === eventSlug);
      const existing = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", eventSlug))
        .unique();

      const merchantSlug =
        eventSlug === "jerk-x-jollof-accra" ? "jerk-x-jollof" : "keinemusik-co";
      const merchantId = slugToMerchantId.get(merchantSlug);
      if (!merchantId) continue;

      if (existing === null) {
        await ctx.db.insert("events", {
          merchantId,
          organizerMerchantId: merchantId,
          name:
            eventSlug === "jerk-x-jollof-accra"
              ? "Jerk x Jollof Accra"
              : eventSlug === "keinemusik-cape-town"
                ? "Keinemusik Cape Town"
                : "Afropunk Joburg 2026",
          slug: eventSlug,
          description:
            eventSlug === "jerk-x-jollof-accra"
              ? "The ultimate Afro-Caribbean food and music experience."
              : undefined,
          location:
            eventSlug === "jerk-x-jollof-accra"
              ? "Accra, Ghana"
              : eventSlug === "keinemusik-cape-town"
                ? "Cape Town, South Africa"
                : "Johannesburg, South Africa",
          startTime: now + (eventSlug === "jerk-x-jollof-accra" ? 14 : 30) * 86400000,
          inAppTicketing: true,
          feedCategories: meta.feedCategories,
          discoverCategorySlugs: discoverSlugsFor(meta.feedCategories, [
            eventSlug === "keinemusik-cape-town" ? "night-clubs" : "",
            eventSlug === "afropunk-joburg-2026" ? "night-clubs" : "",
          ].filter(Boolean)),
          feedBadge: meta.feedBadge,
          chyron: meta.chyron,
          imageStorageId: images?.imageStorageId,
          galleryStorageIds: images?.galleryStorageIds,
          mediaAspect: images?.mediaAspect ?? meta.mediaAspect,
          imageWidth: images?.imageWidth ?? meta.imageWidth,
          imageHeight: images?.imageHeight ?? meta.imageHeight,
          createdAt: now,
        });
        eventsUpserted += 1;
      } else {
        await ctx.db.patch(existing._id, {
          feedCategories: meta.feedCategories,
          discoverCategorySlugs: discoverSlugsFor(meta.feedCategories),
          feedBadge: meta.feedBadge,
          chyron: meta.chyron,
          ...(images?.imageStorageId ? { imageStorageId: images.imageStorageId } : {}),
          ...(images?.galleryStorageIds
            ? { galleryStorageIds: images.galleryStorageIds }
            : {}),
          ...(images?.mediaAspect ? { mediaAspect: images.mediaAspect } : {}),
          ...(images?.imageWidth ? { imageWidth: images.imageWidth } : {}),
          ...(images?.imageHeight ? { imageHeight: images.imageHeight } : {}),
        });
        eventsUpserted += 1;
      }
    }

    const shimmyId = slugToMerchantId.get("shimmy-beach-club");
    if (shimmyId) {
      const postSlug = "weekend-vibes-shimmy";
      const postImages = args.postImages.find((p) => p.slug === postSlug);
      const existingPost = await ctx.db
        .query("posts")
        .withIndex("by_slug", (q) => q.eq("slug", postSlug))
        .unique();
      if (existingPost === null) {
        await ctx.db.insert("posts", {
          merchantId: shimmyId,
          slug: postSlug,
          title: "Weekend vibes at Shimmy Beach",
          subtitle: "Beach club highlights",
          caption:
            "Catch the sunset with live DJs every Friday and Saturday. Cabanas, frozen cocktails, and good energy all weekend long.",
          feedCategories: ["Beach bars", "Events"],
          discoverCategorySlugs: ["beach-bars", "sundowners", "on-the-coast"],
          feedBadge: { label: "FEATURED", color: "#7C4DFF" },
          operatingStatus: "open",
          imageStorageId: postImages?.imageStorageId,
          galleryStorageIds: postImages?.galleryStorageIds,
          mediaAspect: postImages?.mediaAspect ?? "portrait45",
          imageWidth: postImages?.imageWidth ?? 600,
          imageHeight: postImages?.imageHeight ?? 750,
          isActive: true,
          createdAt: now,
        });
        postsUpserted += 1;
      } else {
        await ctx.db.patch(existingPost._id, {
          feedCategories: ["Beach bars", "Events"],
          discoverCategorySlugs: ["beach-bars", "sundowners", "on-the-coast"],
          feedBadge: { label: "FEATURED", color: "#7C4DFF" },
          operatingStatus: "open",
          ...(postImages?.imageStorageId
            ? { imageStorageId: postImages.imageStorageId }
            : {}),
        });
        postsUpserted += 1;
      }
    }

    const himatsuId = slugToMerchantId.get("himatsu-studio");
    if (himatsuId) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", "summer-collection-drop"))
        .unique();
      const himatsuImage = args.productImages.find(
        (p) => p.slug === "summer-collection-drop",
      );
      if (existing === null) {
        const cat = await ctx.db.query("categories").first();
        if (cat) {
          await ctx.db.insert("products", {
            merchantId: himatsuId,
            name: "Summer Collection Drop",
            slug: "summer-collection-drop",
            description:
              "Limited-edition capsule collection featuring bold prints and relaxed fits. Available for pre-order exclusively on AUX.",
            priceCents: 89000,
            currency: "gbp",
            categoryId: cat._id,
            stock: 50,
            unit: "item",
            productKind: "retail",
            feedCategories: ["Products", "Fashion"],
            feedBadge: { label: "PRE-ORDER", color: "#FF6F00" },
            feedHighlight: true,
            imageStorageId: himatsuImage?.imageStorageId,
            mediaAspect: "story",
            imageWidth: 1080,
            imageHeight: 1920,
            isActive: true,
            createdAt: now,
          });
          productsUpdated += 1;
        }
      }
    }

    return {
      discoverTiles,
      merchantsUpserted,
      placesUpserted,
      eventsUpserted,
      productsUpdated,
      postsUpserted,
    };
  },
});

export const _getUserByClerk = internalQuery({
  args: { clerkUserId: v.string() },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    return user?._id ?? null;
  },
});

export const _getFirstAdminUser = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(200);
    const admin = users.find(
      (u) => u.role === "admin" || u.role === "platformAdmin",
    );
    return admin?._id ?? users[0]?._id ?? null;
  },
});

export const run = internalAction({
  args: { clerkUserId: v.optional(v.string()) },
  returns: v.object({
    discoverTiles: v.number(),
    merchantsUpserted: v.number(),
    placesUpserted: v.number(),
    eventsUpserted: v.number(),
    productsUpdated: v.number(),
    postsUpserted: v.number(),
    imagesUploaded: v.number(),
  }),
  handler: async (ctx: ActionCtx, args): Promise<{
    discoverTiles: number;
    merchantsUpserted: number;
    placesUpserted: number;
    eventsUpserted: number;
    productsUpdated: number;
    postsUpserted: number;
    imagesUploaded: number;
  }> => {
    let ownerUserId: Id<"users"> | null = null;
    if (args.clerkUserId) {
      ownerUserId = await ctx.runQuery(internal.seedShowcase._getUserByClerk, {
        clerkUserId: args.clerkUserId,
      });
    }
    if (ownerUserId === null) {
      ownerUserId = await ctx.runQuery(internal.seedShowcase._getFirstAdminUser, {});
    }
    if (ownerUserId === null) {
      throw new Error("No owner user found for showcase seed.");
    }

    await ctx.runMutation(internal.seedInterests.seedInterestCategories, {});

    let imagesUploaded = 0;
    const store = async (url: string) => {
      const blob = await fetchAsBlob(url);
      imagesUploaded += 1;
      return await ctx.storage.store(blob);
    };

    const discoverImages: Array<{ slug: string; imageStorageId: Id<"_storage"> }> =
      [];
    for (const tile of DISCOVER_TILES) {
      discoverImages.push({ slug: tile.slug, imageStorageId: await store(tile.imageUrl) });
    }

    const laParadaGallery = [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    ];
    const merchantImages = [
      {
        slug: "la-parada",
        logoStorageId: await store(
          "https://i.pravatar.cc/160?u=la-parada",
        ),
        coverStorageId: await store(laParadaGallery[0]),
        galleryStorageIds: await Promise.all(laParadaGallery.map((u) => store(u))),
      },
      {
        slug: "sbcltr",
        logoStorageId: await store("https://i.pravatar.cc/160?u=sbcltr"),
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080&q=80",
        ),
        galleryStorageIds: [
          await store(
            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080&q=80",
          ),
        ],
      },
      {
        slug: "keinemusik-co",
        logoStorageId: await store("https://i.pravatar.cc/160?u=keinemusik"),
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1080&q=80",
        ),
        galleryStorageIds: await Promise.all(
          [
            "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
            "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
          ].map((u) => store(u)),
        ),
      },
      {
        slug: "the-lawns",
        logoStorageId: await store("https://i.pravatar.cc/160?u=lawns"),
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80",
        ),
        galleryStorageIds: await Promise.all(
          [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1080&q=80",
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1080&q=80",
            "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1080&q=80",
          ].map((u) => store(u)),
        ),
      },
      {
        slug: "shimmy-beach-club",
        logoStorageId: await store("https://i.pravatar.cc/160?u=shimmy"),
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80",
        ),
      },
      {
        slug: "jerk-x-jollof",
        logoStorageId: await store("https://i.pravatar.cc/160?u=jxj"),
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1080&q=80",
        ),
      },
    ];

    const placeImages = [
      {
        slug: "sbcltr-venue",
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080&q=80",
        ),
        mediaAspect: "square" as const,
        imageWidth: 1080,
        imageHeight: 1080,
      },
      {
        slug: "the-lawns-venue",
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80",
        ),
        galleryStorageIds: await Promise.all(
          [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1080&q=80",
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1080&q=80",
            "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1080&q=80",
          ].map((u) => store(u)),
        ),
        mediaAspect: "portrait45" as const,
        imageWidth: 1080,
        imageHeight: 1350,
      },
      {
        slug: "orphanage-cpt",
        coverStorageId: await store(
          "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1080&q=80",
        ),
        galleryStorageIds: [
          await store(
            "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1080&q=80",
          ),
        ],
        mediaAspect: "square" as const,
        imageWidth: 1080,
        imageHeight: 1080,
      },
      {
        slug: "la-parada-venue",
        coverStorageId: await store(laParadaGallery[3]),
        mediaAspect: "landscape" as const,
        imageWidth: 1080,
        imageHeight: 608,
      },
    ];

    const productImages: Array<{
      slug: string;
      imageStorageId: Id<"_storage">;
      mediaAspect: MediaAspect;
      imageWidth: number;
      imageHeight: number;
    }> = [];

    for (const [slug, meta] of Object.entries(LA_PARADA_UNSPLASH)) {
      productImages.push({
        slug,
        imageStorageId: await store(meta.url),
        mediaAspect: meta.mediaAspect,
        imageWidth: meta.imageWidth,
        imageHeight: meta.imageHeight,
      });
    }

    productImages.push({
      slug: "summer-collection-drop",
      imageStorageId: await store(
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&q=80",
      ),
      mediaAspect: "story",
      imageWidth: 1080,
      imageHeight: 1920,
    });

    const eventImages: Array<{
      slug: string;
      imageStorageId: Id<"_storage">;
      galleryStorageIds?: Id<"_storage">[];
      mediaAspect: MediaAspect;
      imageWidth: number;
      imageHeight: number;
    }> = [];

    for (const [slug, meta] of Object.entries(EVENT_UNSPLASH)) {
      eventImages.push({
        slug,
        imageStorageId: await store(meta.url),
        galleryStorageIds: meta.galleryUrls
          ? await Promise.all(meta.galleryUrls.map((u) => store(u)))
          : undefined,
        mediaAspect: meta.mediaAspect,
        imageWidth: meta.imageWidth,
        imageHeight: meta.imageHeight,
      });
    }

    const postImages = [
      {
        slug: "weekend-vibes-shimmy",
        imageStorageId: await store(
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        ),
        mediaAspect: "portrait45" as const,
        imageWidth: 600,
        imageHeight: 750,
      },
    ];

    const result = await ctx.runMutation(internal.seedShowcase._applyShowcaseData, {
      ownerUserId,
      discoverImages,
      merchantImages,
      placeImages,
      productImages,
      eventImages,
      postImages,
    });

    return { ...result, imagesUploaded };
  },
});
