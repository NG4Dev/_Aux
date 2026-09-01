import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp";

type MediaAspect =
  | "square"
  | "portrait45"
  | "portrait34"
  | "landscape"
  | "story";

type MerchantSeed = {
  slug: string;
  name: string;
  tagline: string;
  type: "restaurant" | "retail" | "event_organizer" | "other";
  description: string;
  location?: { address: string; lat?: number; lng?: number };
  linkedPlaceSlug?: string;
  feedCategories?: string[];
  discoverCategorySlugs?: string[];
};

type PlaceSeed = {
  slug: string;
  name: string;
  description: string;
  placeKind: "venue" | "other";
  location?: { address: string; lat?: number; lng?: number };
  linkedMerchantSlug?: string;
};

type ProductSeed = {
  merchantSlug: string;
  categorySlug: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  unit: string;
  mediaAspect: MediaAspect;
  imageWidth: number;
  imageHeight: number;
  /** Optional sample video for story/reel product testing (mobile may map by slug). */
  mediaType?: 'image' | 'video';
  sampleVideoUrl?: string;
};

type EventSeed = {
  merchantSlug: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  startTimeOffsetDays: number;
  venuePlaceSlug?: string;
  mediaAspect?: MediaAspect;
  imageWidth?: number;
  imageHeight?: number;
  ticketTypes: Array<{
    tier: "GA" | "VIP" | "Other";
    name: string;
    priceCents: number;
    capacity: number;
  }>;
};

const MERCHANT_SEEDS: MerchantSeed[] = [
  {
    slug: "ycago-grocery",
    name: "ycago Grocery",
    tagline: "Fresh local delivery",
    type: "retail",
    description: "Default grocery merchant for the ycago storefront.",
  },
  {
    slug: "la-parada",
    name: "La Parada",
    tagline: "Bar de Tapas",
    type: "restaurant",
    description:
      "Authentic Spanish tapas bar in the heart of Cape Town.",
    location: { address: "Cape Town, South Africa" },
    linkedPlaceSlug: "la-parada-venue",
    feedCategories: ["Tapas", "Spanish", "Sundowners"],
    discoverCategorySlugs: ["beach-bars", "sundowners"],
  },
  {
    slug: "keinemusik-co",
    name: "Keinemusik",
    tagline: "Music collective & event organizer",
    type: "event_organizer",
    description:
      "Berlin-based music collective bringing world-class deep house and afro electronic events.",
    location: { address: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  },
  {
    slug: "bikini-beach-bar",
    name: "Bikini Beach Bar",
    tagline: "Camps Bay sundowners",
    type: "restaurant",
    description:
      "Beachfront cocktail bar on Camps Bay strip — seafood grills, frozen margaritas, and Atlantic sunset views.",
    location: { address: "Camps Bay, Cape Town, South Africa" },
    linkedPlaceSlug: "bikini-beach-bar-venue",
    feedCategories: ["Seafood", "Cocktails", "Sundowners"],
    discoverCategorySlugs: ["beach-bars", "sundowners", "on-the-coast"],
  },
  {
    slug: "the-bay-beach-club",
    name: "The Bay Beach Club",
    tagline: "Clifton beach dining",
    type: "restaurant",
    description:
      "Relaxed Clifton beach club with light bites, craft spritzes, and share plates for long summer afternoons.",
    location: { address: "Clifton, Cape Town, South Africa" },
    linkedPlaceSlug: "the-bay-beach-club-venue",
    feedCategories: ["Beach club", "Tapas", "Drinks"],
    discoverCategorySlugs: ["beach-bars", "sundowners"],
  },
];

const PLACE_SEEDS: PlaceSeed[] = [
  {
    slug: "la-parada-venue",
    name: "La Parada Waterfront",
    description: "Waterfront dining venue hosting live music nights.",
    placeKind: "venue",
    location: { address: "V&A Waterfront, Cape Town" },
    linkedMerchantSlug: "la-parada",
  },
  {
    slug: "grand-arena-cpt",
    name: "Grand Arena Cape Town",
    description: "Large concert venue for international acts.",
    placeKind: "venue",
    location: { address: "Grand West, Cape Town" },
  },
  {
    slug: "fnb-stadium-jhb",
    name: "FNB Stadium",
    description: "Major stadium hosting festivals and sports events.",
    placeKind: "venue",
    location: { address: "Johannesburg, South Africa" },
  },
  {
    slug: "bikini-beach-bar-venue",
    name: "Bikini Beach Bar",
    description: "Camps Bay beachfront terrace with sundowner deck.",
    placeKind: "venue",
    location: { address: "Victoria Road, Camps Bay, Cape Town" },
    linkedMerchantSlug: "bikini-beach-bar",
  },
  {
    slug: "the-bay-beach-club-venue",
    name: "The Bay Beach Club",
    description: "Clifton Fourth Beach club with ocean-view seating.",
    placeKind: "venue",
    location: { address: "Clifton Fourth Beach, Cape Town" },
    linkedMerchantSlug: "the-bay-beach-club",
  },
];

const LA_PARADA_PRODUCTS: ProductSeed[] = [
  {
    merchantSlug: "la-parada",
    categorySlug: "tapas",
    categoryName: "Tapas",
    name: "Patatas Bravas",
    slug: "patatas-bravas",
    description: "Crispy potatoes with brava sauce and garlic aioli.",
    priceCents: 6500,
    stock: 50,
    unit: "plate",
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
  },
  {
    merchantSlug: "la-parada",
    categorySlug: "tapas",
    categoryName: "Tapas",
    name: "Gambas al Ajillo",
    slug: "gambas-al-ajillo",
    description: "Sizzling garlic prawns in olive oil.",
    priceCents: 9500,
    stock: 40,
    unit: "plate",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
  },
  {
    merchantSlug: "la-parada",
    categorySlug: "mains",
    categoryName: "Mains",
    name: "Paella Valenciana",
    slug: "paella-valenciana",
    description: "Traditional Valencian paella with saffron.",
    priceCents: 22000,
    stock: 20,
    unit: "serving",
    mediaAspect: "portrait34",
    imageWidth: 1080,
    imageHeight: 1440,
  },
  {
    merchantSlug: "la-parada",
    categorySlug: "drinks",
    categoryName: "Drinks",
    name: "Sangria de la Casa",
    slug: "sangria-de-la-casa",
    description: "House red sangria with seasonal fruit.",
    priceCents: 8500,
    stock: 60,
    unit: "glass",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 566,
  },
  {
    merchantSlug: "la-parada",
    categorySlug: "tapas",
    categoryName: "Tapas",
    name: "Croquetas de Jamón",
    slug: "croquetas-jamon",
    description: "Crispy ham croquettes with béchamel.",
    priceCents: 7500,
    stock: 45,
    unit: "plate",
    mediaAspect: "story",
    imageWidth: 1080,
    imageHeight: 1920,
    mediaType: "video",
    sampleVideoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
];

const BIKINI_BEACH_BAR_PRODUCTS: ProductSeed[] = [
  {
    merchantSlug: "bikini-beach-bar",
    categorySlug: "tapas",
    categoryName: "Tapas",
    name: "Grilled Prawn Skewers",
    slug: "bikini-prawn-skewers",
    description:
      "Chargrilled tiger prawns with lemon butter, garlic, and smoked paprika — a Camps Bay seafood classic.",
    priceCents: 12500,
    stock: 35,
    unit: "plate",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
  },
  {
    merchantSlug: "bikini-beach-bar",
    categorySlug: "drinks",
    categoryName: "Drinks",
    name: "Frozen Margarita",
    slug: "bikini-frozen-margarita",
    description:
      "Blended tequila margarita with fresh lime and agave — ideal for beach-bar sundowners.",
    priceCents: 9500,
    stock: 80,
    unit: "glass",
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
  },
  {
    merchantSlug: "bikini-beach-bar",
    categorySlug: "mains",
    categoryName: "Mains",
    name: "Linefish of the Day",
    slug: "bikini-linefish",
    description:
      "Catch of the day grilled with herb butter, served with seasonal slaw and hand-cut fries.",
    priceCents: 18500,
    stock: 25,
    unit: "serving",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 566,
  },
];

const THE_BAY_BEACH_CLUB_PRODUCTS: ProductSeed[] = [
  {
    merchantSlug: "the-bay-beach-club",
    categorySlug: "tapas",
    categoryName: "Tapas",
    name: "Fish Tacos",
    slug: "bay-club-fish-tacos",
    description:
      "Crispy battered hake tacos with chipotle crema, pickled red onion, and coriander — Clifton beach share plate.",
    priceCents: 11000,
    stock: 40,
    unit: "plate",
    mediaAspect: "square",
    imageWidth: 1080,
    imageHeight: 1080,
  },
  {
    merchantSlug: "the-bay-beach-club",
    categorySlug: "drinks",
    categoryName: "Drinks",
    name: "Sunset Spritz",
    slug: "bay-club-sunset-spritz",
    description:
      "Aperol-style spritz with prosecco, soda, and orange — light sparkling cocktail for afternoon beach sessions.",
    priceCents: 9000,
    stock: 70,
    unit: "glass",
    mediaAspect: "portrait34",
    imageWidth: 1080,
    imageHeight: 1440,
  },
  {
    merchantSlug: "the-bay-beach-club",
    categorySlug: "tapas",
    categoryName: "Tapas",
    name: "Calamari Rings",
    slug: "bay-club-calamari",
    description:
      "Lightly fried calamari with lemon aioli and chili — crispy seafood starter popular at Clifton beach clubs.",
    priceCents: 10500,
    stock: 45,
    unit: "plate",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
  },
];

/** Menu products seeded for commerce + assistant/RAG corpus (verified merchants only). */
const PLATFORM_MENU_PRODUCTS: ProductSeed[] = [...LA_PARADA_PRODUCTS];

/** Stable food photography for La Parada — avoids random picsum placeholders. */
const LA_PARADA_SEED_IMAGES: Record<string, string> = {
  "patatas-bravas":
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f",
  "gambas-al-ajillo":
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47",
  "paella-valenciana":
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
  "sangria-de-la-casa":
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b",
  "croquetas-jamon":
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
};

const EVENT_SEEDS: EventSeed[] = [
  {
    merchantSlug: "keinemusik-co",
    slug: "keinemusik-cape-town",
    name: "Keinemusik Cape Town",
    description:
      "Keinemusik crew is coming to Cape Town for an unforgettable night of house music.",
    location: "Cape Town, South Africa",
    startTimeOffsetDays: 30,
    venuePlaceSlug: "grand-arena-cpt",
    mediaAspect: "landscape",
    imageWidth: 1080,
    imageHeight: 566,
    ticketTypes: [
      { tier: "GA", name: "General Admission", priceCents: 45000, capacity: 500 },
      { tier: "VIP", name: "VIP", priceCents: 85000, capacity: 100 },
    ],
  },
  {
    merchantSlug: "keinemusik-co",
    slug: "afropunk-joburg-2026",
    name: "Afropunk Joburg 2026",
    description:
      "Three days of music, art, fashion, and film celebrating the African creative diaspora.",
    location: "Johannesburg, South Africa",
    startTimeOffsetDays: 90,
    venuePlaceSlug: "fnb-stadium-jhb",
    mediaAspect: "portrait45",
    imageWidth: 1080,
    imageHeight: 1350,
    ticketTypes: [
      { tier: "GA", name: "Weekend Pass", priceCents: 120000, capacity: 2000 },
      { tier: "VIP", name: "VIP Weekend", priceCents: 250000, capacity: 200 },
    ],
  },
];

function imageUrlForSeed(slug: string, width: number, height: number): string {
  const laParadaImage = LA_PARADA_SEED_IMAGES[slug];
  if (laParadaImage) {
    return `${laParadaImage}?w=${width}&h=${height}&fit=crop&q=80`;
  }
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/${width}/${height}`;
}

async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Image fetch failed: ${res.status} ${res.statusText} for ${url}`,
    );
  }
  return await res.blob();
}

export const _seedPlatformData = internalMutation({
  args: {
    ownerUserId: v.id("users"),
    productImages: v.array(
      v.object({
        slug: v.string(),
        imageStorageId: v.id("_storage"),
        mediaAspect: v.union(
          v.literal("square"),
          v.literal("portrait45"),
          v.literal("portrait34"),
          v.literal("landscape"),
          v.literal("story"),
        ),
        imageWidth: v.number(),
        imageHeight: v.number(),
      }),
    ),
    eventImages: v.array(
      v.object({
        slug: v.string(),
        imageStorageId: v.id("_storage"),
        mediaAspect: v.union(
          v.literal("square"),
          v.literal("portrait45"),
          v.literal("portrait34"),
          v.literal("landscape"),
          v.literal("story"),
        ),
        imageWidth: v.number(),
        imageHeight: v.number(),
      }),
    ),
  },
  returns: v.object({
    merchantsCreated: v.number(),
    placesCreated: v.number(),
    productsCreated: v.number(),
    productsUpdated: v.number(),
    eventsCreated: v.number(),
    eventsUpdated: v.number(),
    productsBackfilled: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let merchantsCreated = 0;
    let placesCreated = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    let eventsCreated = 0;
    let eventsUpdated = 0;
    let productsBackfilled = 0;

    const slugToMerchantId = new Map<string, Id<"merchants">>();
    const slugToPlaceId = new Map<string, Id<"places">>();

    for (const seed of MERCHANT_SEEDS) {
      const existing = await ctx.db
        .query("merchants")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();

      if (existing !== null) {
        slugToMerchantId.set(seed.slug, existing._id);
        if (seed.feedCategories || seed.discoverCategorySlugs) {
          await ctx.db.patch(existing._id, {
            ...(seed.feedCategories ? { feedCategories: seed.feedCategories } : {}),
            ...(seed.discoverCategorySlugs
              ? { discoverCategorySlugs: seed.discoverCategorySlugs }
              : {}),
          });
        }
        continue;
      }

      const merchantId = await ctx.db.insert("merchants", {
        ownerUserId: args.ownerUserId,
        slug: seed.slug,
        name: seed.name,
        tagline: seed.tagline,
        type: seed.type,
        description: seed.description,
        location: seed.location,
        feedCategories: seed.feedCategories,
        discoverCategorySlugs: seed.discoverCategorySlugs,
        isActive: true,
        createdAt: now,
      });

      await ctx.db.insert("merchantMembers", {
        merchantId,
        userId: args.ownerUserId,
        role: "owner",
        createdAt: now,
      });

      slugToMerchantId.set(seed.slug, merchantId);
      merchantsCreated += 1;
    }

    for (const placeSeed of PLACE_SEEDS) {
      const existing = await ctx.db
        .query("places")
        .withIndex("by_slug", (q) => q.eq("slug", placeSeed.slug))
        .unique();

      if (existing !== null) {
        slugToPlaceId.set(placeSeed.slug, existing._id);
        continue;
      }

      const linkedMerchantId = placeSeed.linkedMerchantSlug
        ? slugToMerchantId.get(placeSeed.linkedMerchantSlug)
        : undefined;

      const placeId = await ctx.db.insert("places", {
        slug: placeSeed.slug,
        name: placeSeed.name,
        description: placeSeed.description,
        location: placeSeed.location,
        placeKind: placeSeed.placeKind,
        linkedMerchantId,
        ownerUserId: args.ownerUserId,
        isActive: true,
        createdAt: now,
      });
      slugToPlaceId.set(placeSeed.slug, placeId);
      placesCreated += 1;
    }

    for (const merchantSeed of MERCHANT_SEEDS) {
      if (!merchantSeed.linkedPlaceSlug) continue;
      const merchantId = slugToMerchantId.get(merchantSeed.slug);
      const placeId = slugToPlaceId.get(merchantSeed.linkedPlaceSlug);
      if (!merchantId || !placeId) continue;
      const merchant = await ctx.db.get(merchantId);
      if (merchant && merchant.linkedPlaceId === undefined) {
        await ctx.db.patch(merchantId, { linkedPlaceId: placeId });
      }
    }

    const productImageMap = new Map(
      args.productImages.map((p) => [p.slug, p]),
    );

    const groceryMerchantId = slugToMerchantId.get("ycago-grocery");
    if (groceryMerchantId) {
      const products = await ctx.db.query("products").take(500);
      for (const product of products) {
        if (product.merchantId === undefined) {
          await ctx.db.patch(product._id, { merchantId: groceryMerchantId });
          productsBackfilled += 1;
        }
      }
    }

    const categoryCache = new Map<string, Id<"categories">>();
    for (const productSeed of PLATFORM_MENU_PRODUCTS) {
      const merchantId = slugToMerchantId.get(productSeed.merchantSlug);
      if (!merchantId) continue;

      const catKey = `${productSeed.merchantSlug}:${productSeed.categorySlug}`;
      let categoryId = categoryCache.get(catKey);
      if (!categoryId) {
        const existingCat = await ctx.db
          .query("categories")
          .withIndex("by_slug", (q) => q.eq("slug", productSeed.categorySlug))
          .unique();
        if (existingCat) {
          categoryId = existingCat._id;
        } else {
          categoryId = await ctx.db.insert("categories", {
            name: productSeed.categoryName,
            slug: productSeed.categorySlug,
            sortOrder: 100,
          });
        }
        categoryCache.set(catKey, categoryId);
      }

      const imageMeta = productImageMap.get(productSeed.slug);
      const existingProduct = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", productSeed.slug))
        .unique();

      if (existingProduct !== null) {
        if (imageMeta) {
          await ctx.db.patch(existingProduct._id, {
            imageStorageId: imageMeta.imageStorageId,
            mediaAspect: imageMeta.mediaAspect,
            imageWidth: imageMeta.imageWidth,
            imageHeight: imageMeta.imageHeight,
          });
          productsUpdated += 1;
        }
        continue;
      }

      await ctx.db.insert("products", {
        merchantId,
        name: productSeed.name,
        slug: productSeed.slug,
        description: productSeed.description,
        priceCents: productSeed.priceCents,
        currency: DEFAULT_CURRENCY,
        categoryId,
        stock: productSeed.stock,
        unit: productSeed.unit,
        productKind: "menu",
        isActive: true,
        createdAt: now,
        imageStorageId: imageMeta?.imageStorageId,
        mediaAspect: imageMeta?.mediaAspect ?? productSeed.mediaAspect,
        imageWidth: imageMeta?.imageWidth ?? productSeed.imageWidth,
        imageHeight: imageMeta?.imageHeight ?? productSeed.imageHeight,
      });
      productsCreated += 1;
    }

    const eventImageMap = new Map(args.eventImages.map((e) => [e.slug, e]));

    for (const eventSeed of EVENT_SEEDS) {
      const merchantId = slugToMerchantId.get(eventSeed.merchantSlug);
      if (!merchantId) continue;

      const venuePlaceId = eventSeed.venuePlaceSlug
        ? slugToPlaceId.get(eventSeed.venuePlaceSlug)
        : undefined;
      const imageMeta = eventImageMap.get(eventSeed.slug);

      const existingEvent = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", eventSeed.slug))
        .unique();

      if (existingEvent !== null) {
        const patch: Record<string, unknown> = {};
        if (venuePlaceId) {
          patch.venuePlaceId = venuePlaceId;
          patch.organizerMerchantId = merchantId;
        }
        if (imageMeta) {
          patch.imageStorageId = imageMeta.imageStorageId;
          patch.mediaAspect = imageMeta.mediaAspect;
          patch.imageWidth = imageMeta.imageWidth;
          patch.imageHeight = imageMeta.imageHeight;
        }
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(existingEvent._id, patch);
          eventsUpdated += 1;
        }
        continue;
      }

      const eventId = await ctx.db.insert("events", {
        merchantId,
        organizerMerchantId: merchantId,
        venuePlaceId,
        name: eventSeed.name,
        slug: eventSeed.slug,
        description: eventSeed.description,
        location: eventSeed.location,
        startTime: now + eventSeed.startTimeOffsetDays * 24 * 60 * 60 * 1000,
        inAppTicketing: true,
        createdAt: now,
        imageStorageId: imageMeta?.imageStorageId,
        mediaAspect: imageMeta?.mediaAspect ?? eventSeed.mediaAspect,
        imageWidth: imageMeta?.imageWidth ?? eventSeed.imageWidth,
        imageHeight: imageMeta?.imageHeight ?? eventSeed.imageHeight,
      });

      for (const tt of eventSeed.ticketTypes) {
        await ctx.db.insert("ticketTypes", {
          eventId,
          tier: tt.tier,
          name: tt.name,
          priceCents: tt.priceCents,
          currency: DEFAULT_CURRENCY,
          capacity: tt.capacity,
          soldCount: 0,
          refundPolicy: "standard",
          isActive: true,
        });
      }

      eventsCreated += 1;
    }

    return {
      merchantsCreated,
      placesCreated,
      productsCreated,
      productsUpdated,
      eventsCreated,
      eventsUpdated,
      productsBackfilled,
    };
  },
});

export const seedPlatform = internalAction({
  args: {
    clerkUserId: v.optional(v.string()),
  },
  returns: v.object({
    merchantsCreated: v.number(),
    placesCreated: v.number(),
    productsCreated: v.number(),
    productsUpdated: v.number(),
    eventsCreated: v.number(),
    eventsUpdated: v.number(),
    productsBackfilled: v.number(),
    imagesUploaded: v.number(),
  }),
  handler: async (
    ctx: ActionCtx,
    args,
  ): Promise<{
    merchantsCreated: number;
    placesCreated: number;
    productsCreated: number;
    productsUpdated: number;
    eventsCreated: number;
    eventsUpdated: number;
    productsBackfilled: number;
    imagesUploaded: number;
  }> => {
    let ownerUserId: Id<"users"> | null = null;

    if (args.clerkUserId) {
      ownerUserId = await ctx.runQuery(internal.seedPlatform._getUserByClerk, {
        clerkUserId: args.clerkUserId,
      });
    }

    if (ownerUserId === null) {
      ownerUserId = await ctx.runQuery(internal.seedPlatform._getFirstAdminUser, {});
    }

    if (ownerUserId === null) {
      throw new Error(
        "No owner user found. Pass clerkUserId or promote a platform admin first.",
      );
    }

    const productImages: Array<{
      slug: string;
      imageStorageId: Id<"_storage">;
      mediaAspect: MediaAspect;
      imageWidth: number;
      imageHeight: number;
    }> = [];

    for (const p of PLATFORM_MENU_PRODUCTS) {
      const blob = await fetchAsBlob(
        imageUrlForSeed(p.slug, p.imageWidth, p.imageHeight),
      );
      const storageId = await ctx.storage.store(blob);
      productImages.push({
        slug: p.slug,
        imageStorageId: storageId,
        mediaAspect: p.mediaAspect,
        imageWidth: p.imageWidth,
        imageHeight: p.imageHeight,
      });
    }

    const eventImages: Array<{
      slug: string;
      imageStorageId: Id<"_storage">;
      mediaAspect: MediaAspect;
      imageWidth: number;
      imageHeight: number;
    }> = [];

    for (const e of EVENT_SEEDS) {
      if (!e.mediaAspect || !e.imageWidth || !e.imageHeight) continue;
      const blob = await fetchAsBlob(
        imageUrlForSeed(e.slug, e.imageWidth, e.imageHeight),
      );
      const storageId = await ctx.storage.store(blob);
      eventImages.push({
        slug: e.slug,
        imageStorageId: storageId,
        mediaAspect: e.mediaAspect,
        imageWidth: e.imageWidth,
        imageHeight: e.imageHeight,
      });
    }

    const result = await ctx.runMutation(internal.seedPlatform._seedPlatformData, {
      ownerUserId,
      productImages,
      eventImages,
    });

    const showcase = await ctx.runAction(internal.seedShowcase.run, {
      clerkUserId: args.clerkUserId,
    });

    await ctx.runAction(internal.embeddingsMerchants.backfillAll, { force: true });
    await ctx.runAction(internal.embeddingsPlaces.backfillAll, { force: true });
    await ctx.runAction(internal.embeddings.backfillAll, { force: true });

    return {
      ...result,
      imagesUploaded: productImages.length + eventImages.length + showcase.imagesUploaded,
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
