import { v } from "convex/values";
import { query } from "../_generated/server";
import schema from "../schema";
import type { Doc, Id } from "../_generated/dataModel";
import { locationValidator, mediaAspectValidator, merchantTypeValidator, operatingStatusValidator } from "../schema";

const merchantDocValidator = v.object({
  _id: v.id("merchants"),
  _creationTime: v.number(),
  ...schema.tables.merchants.validator.fields,
});

const productWithMediaValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  priceCents: v.number(),
  currency: v.string(),
  categoryId: v.id("categories"),
  categoryName: v.string(),
  categorySlug: v.string(),
  merchantId: v.optional(v.id("merchants")),
  stock: v.number(),
  unit: v.string(),
  productKind: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  imageUrl: v.union(v.string(), v.null()),
  mediaAspect: v.union(mediaAspectValidator, v.null()),
  imageWidth: v.optional(v.number()),
  imageHeight: v.optional(v.number()),
});

async function resolveCategoryLabels(
  ctx: { db: { get: (id: import("../_generated/dataModel").Id<"categories">) => Promise<{ name: string } | null> } },
  merchant: {
    feedCategories?: string[];
    interestCategoryIds?: import("../_generated/dataModel").Id<"categories">[];
    discoverCategorySlugs?: string[];
  },
): Promise<string[]> {
  if (merchant.feedCategories && merchant.feedCategories.length > 0) {
    return merchant.feedCategories;
  }
  if (merchant.interestCategoryIds && merchant.interestCategoryIds.length > 0) {
    const names = await Promise.all(
      merchant.interestCategoryIds.map(async (id) => {
        const cat = await ctx.db.get(id);
        return cat?.name ?? null;
      }),
    );
    return names.filter((n): n is string => n !== null);
  }
  if (merchant.discoverCategorySlugs && merchant.discoverCategorySlugs.length > 0) {
    return merchant.discoverCategorySlugs.map((slug) =>
      slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    );
  }
  return [];
}

const enrichedMerchantValidator = v.object({
  _id: v.id("merchants"),
  _creationTime: v.number(),
  ...schema.tables.merchants.validator.fields,
  logoUrl: v.union(v.string(), v.null()),
  categoryLabels: v.array(v.string()),
});

async function merchantWithExtras(
  ctx: {
    storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> };
    db: { get: (id: Id<"categories">) => Promise<Doc<"categories"> | null> };
  },
  merchant: Doc<"merchants">,
) {
  const logoUrl = merchant.logoStorageId
    ? await ctx.storage.getUrl(merchant.logoStorageId)
    : null;
  const categoryLabels = await resolveCategoryLabels(ctx, merchant);
  return {
    ...merchant,
    logoUrl,
    categoryLabels,
  };
}

async function productWithMedia(
  ctx: {
    storage: { getUrl: (id: import("../_generated/dataModel").Id<"_storage">) => Promise<string | null> };
    db: { get: (id: import("../_generated/dataModel").Id<"categories">) => Promise<{ name: string; slug: string } | null> };
  },
  product: {
    _id: import("../_generated/dataModel").Id<"products">;
    _creationTime: number;
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    currency: string;
    categoryId: import("../_generated/dataModel").Id<"categories">;
    merchantId?: import("../_generated/dataModel").Id<"merchants">;
    imageStorageId?: import("../_generated/dataModel").Id<"_storage">;
    mediaAspect?: "square" | "portrait45" | "portrait34" | "landscape" | "story";
    imageWidth?: number;
    imageHeight?: number;
    stock: number;
    unit: string;
    productKind?: string;
    isActive: boolean;
    createdAt: number;
  },
) {
  const category = await ctx.db.get(product.categoryId);
  return {
    _id: product._id,
    _creationTime: product._creationTime,
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    categoryId: product.categoryId,
    categoryName: category?.name ?? "Menu",
    categorySlug: category?.slug ?? "menu",
    merchantId: product.merchantId,
    stock: product.stock,
    unit: product.unit,
    productKind: product.productKind,
    isActive: product.isActive,
    createdAt: product.createdAt,
    imageUrl: product.imageStorageId
      ? await ctx.storage.getUrl(product.imageStorageId)
      : null,
    mediaAspect: product.mediaAspect ?? null,
    imageWidth: product.imageWidth,
    imageHeight: product.imageHeight,
  };
}

export const listActive = query({
  args: {},
  returns: v.array(merchantDocValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("merchants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(100);
  },
});

export const getById = query({
  args: { merchantId: v.id("merchants") },
  returns: v.union(merchantDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.merchantId);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(merchantDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

const merchantWithMediaValidator = v.object({
  _id: v.id("merchants"),
  slug: v.string(),
  name: v.string(),
  tagline: v.union(v.string(), v.null()),
  type: merchantTypeValidator,
  description: v.union(v.string(), v.null()),
  location: v.union(locationValidator, v.null()),
  logoUrl: v.union(v.string(), v.null()),
  coverUrl: v.union(v.string(), v.null()),
  gallery: v.array(
    v.object({
      uri: v.string(),
      type: v.literal("image"),
      width: v.number(),
      height: v.number(),
      aspect: v.optional(v.literal("square")),
    }),
  ),
  operatingStatus: v.union(operatingStatusValidator, v.null()),
});

export const getBySlugWithMedia = query({
  args: { slug: v.string() },
  returns: v.union(merchantWithMediaValidator, v.null()),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (merchant === null) return null;

    const logoUrl = merchant.logoStorageId
      ? await ctx.storage.getUrl(merchant.logoStorageId)
      : null;
    const coverUrl = merchant.coverStorageId
      ? await ctx.storage.getUrl(merchant.coverStorageId)
      : null;
    const galleryUrls = merchant.galleryStorageIds
      ? (
          await Promise.all(
            merchant.galleryStorageIds.map((id) => ctx.storage.getUrl(id)),
          )
        ).filter((url): url is string => url !== null)
      : [];

    return {
      _id: merchant._id,
      slug: merchant.slug,
      name: merchant.name,
      tagline: merchant.tagline ?? null,
      type: merchant.type,
      description: merchant.description ?? null,
      location: merchant.location ?? null,
      logoUrl,
      coverUrl,
      gallery: galleryUrls.map((uri) => ({
        uri,
        type: "image" as const,
        width: 1080,
        height: 1080,
        aspect: "square" as const,
      })),
      operatingStatus: merchant.operatingStatus ?? null,
    };
  },
});

export const listProducts = query({
  args: { merchantSlug: v.string() },
  returns: v.array(productWithMediaValidator),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      return [];
    }
    const products = await ctx.db
      .query("products")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);
    return await Promise.all(products.map((p) => productWithMedia(ctx, p)));
  },
});

const menuCategoryValidator = v.object({
  id: v.id("categories"),
  name: v.string(),
  slug: v.string(),
  sortOrder: v.number(),
});

export const listMenuCategories = query({
  args: { merchantSlug: v.string() },
  returns: v.array(menuCategoryValidator),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      return [];
    }
    const products = await ctx.db
      .query("products")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];
    const categories = await Promise.all(categoryIds.map((id) => ctx.db.get(id)));
    return categories
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  },
});

export const getProduct = query({
  args: {
    merchantSlug: v.string(),
    productSlug: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      product: productWithMediaValidator,
      merchant: enrichedMerchantValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_slug", (q) => q.eq("slug", args.merchantSlug))
      .unique();
    if (merchant === null) {
      return null;
    }
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.productSlug))
      .unique();
    if (
      product === null ||
      !product.isActive ||
      product.merchantId !== merchant._id
    ) {
      return null;
    }
    return {
      product: await productWithMedia(ctx, product),
      merchant: await merchantWithExtras(ctx, merchant),
    };
  },
});

const merchantSummaryValidator = v.object({
  slug: v.string(),
  name: v.string(),
});

export const listMerchantsForDiscoverCategory = query({
  args: { categorySlug: v.string() },
  returns: v.array(merchantSummaryValidator),
  handler: async (ctx, args) => {
    const merchants = await ctx.db
      .query("merchants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(200);
    return merchants
      .filter(
        (m) =>
          m.type === "restaurant" &&
          m.discoverCategorySlugs?.includes(args.categorySlug),
      )
      .map((m) => ({ slug: m.slug, name: m.name }));
  },
});

const menuSearchResultValidator = v.object({
  merchantSlug: v.string(),
  merchantName: v.string(),
  product: productWithMediaValidator,
});

export const searchMenuProducts = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(menuSearchResultValidator),
  handler: async (ctx, args) => {
    const trimmed = args.query.trim().toLowerCase();
    const limit = args.limit ?? 20;
    if (trimmed.length === 0) {
      return [];
    }

    const merchants = await ctx.db
      .query("merchants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(200);
    const restaurantMerchants = merchants.filter((m) => m.type === "restaurant");
    const merchantById = new Map(restaurantMerchants.map((m) => [m._id, m]));

    const nameHits = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) =>
        q.search("name", trimmed).eq("isActive", true),
      )
      .take(limit * 3);

    const seen = new Set<string>();
    const merged: Doc<"products">[] = [];

    for (const p of nameHits) {
      if (seen.has(p._id)) continue;
      if (p.merchantId === undefined || !merchantById.has(p.merchantId)) continue;
      seen.add(p._id);
      merged.push(p);
    }

    if (merged.length < limit) {
      for (const merchant of restaurantMerchants) {
        const products = await ctx.db
          .query("products")
          .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(80);
        for (const p of products) {
          if (merged.length >= limit) break;
          if (seen.has(p._id)) continue;
          const haystack = `${p.name} ${p.description}`.toLowerCase();
          if (!haystack.includes(trimmed)) continue;
          seen.add(p._id);
          merged.push(p);
        }
        if (merged.length >= limit) break;
      }
    }

    const results = await Promise.all(
      merged.slice(0, limit).map(async (p) => {
        const merchant = merchantById.get(p.merchantId!)!;
        return {
          merchantSlug: merchant.slug,
          merchantName: merchant.name,
          product: await productWithMedia(ctx, p),
        };
      }),
    );
    return results;
  },
});

