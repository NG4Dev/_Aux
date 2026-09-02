import { v } from "convex/values";
import { internalQuery, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/** Merchants whose menu products are visible to the assistant agent. */
export const VERIFIED_ASSISTANT_MERCHANT_SLUGS = ["la-parada"] as const;

const productHitValidator = v.object({
  productId: v.string(),
  productSlug: v.string(),
  merchantSlug: v.string(),
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.optional(v.string()),
  priceCents: v.number(),
  imageUrl: v.union(v.string(), v.null()),
});

export type AssistantProductHit = {
  productId: string;
  productSlug: string;
  merchantSlug: string;
  title: string;
  subtitle?: string;
  description?: string;
  priceCents: number;
  imageUrl: string | null;
};

const STOP_WORDS = new Set([
  "i",
  "want",
  "something",
  "to",
  "the",
  "a",
  "an",
  "what",
  "do",
  "you",
  "have",
  "at",
  "la",
  "parada",
  "menu",
  "show",
  "me",
  "any",
  "some",
]);

function isVerifiedMerchant(slug: string): boolean {
  return (VERIFIED_ASSISTANT_MERCHANT_SLUGS as readonly string[]).includes(slug);
}

async function hydrateProduct(
  ctx: {
    storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> };
    db: { get: (id: Id<"categories">) => Promise<{ name: string } | null> };
  },
  product: Doc<"products">,
  merchantSlug: string,
): Promise<AssistantProductHit> {
  const category = await ctx.db.get(product.categoryId);
  return {
    productId: product.slug,
    productSlug: product.slug,
    merchantSlug,
    title: product.name,
    subtitle: category?.name,
    description: product.description,
    priceCents: product.priceCents,
    imageUrl: product.imageStorageId
      ? await ctx.storage.getUrl(product.imageStorageId)
      : null,
  };
}

async function getVerifiedMerchant(
  ctx: QueryCtx,
  merchantSlug: string,
): Promise<{ _id: Id<"merchants">; slug: string } | null> {
  if (!isVerifiedMerchant(merchantSlug)) {
    return null;
  }
  const merchant = await ctx.db
    .query("merchants")
    .withIndex("by_slug", (q) => q.eq("slug", merchantSlug))
    .unique();
  if (merchant === null || !merchant.isActive || merchant.type !== "restaurant") {
    return null;
  }
  return { _id: merchant._id, slug: merchant.slug };
}

function extractTerms(query: string): string[] {
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, " ");
  return [
    ...new Set(
      normalized
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w)),
    ),
  ];
}

function scoreProduct(product: Doc<"products">, categoryName: string, terms: string[]): number {
  const haystack = `${product.name} ${product.description} ${categoryName}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (product.slug.includes(term)) score += 4;
    if (product.name.toLowerCase().includes(term)) score += 3;
    if (product.description.toLowerCase().includes(term)) score += 2;
    if (categoryName.toLowerCase().includes(term)) score += 1;
  }
  return score;
}

export const searchMenuProducts = internalQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(productHitValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;
    const trimmed = args.query.trim();
    if (trimmed.length === 0) return [];

    const merchants = await Promise.all(
      VERIFIED_ASSISTANT_MERCHANT_SLUGS.map(async (slug) => getVerifiedMerchant(ctx, slug)),
    );
    const verifiedMerchants = merchants.filter(
      (m): m is { _id: Id<"merchants">; slug: string } => m !== null,
    );
    if (verifiedMerchants.length === 0) return [];

    const terms = extractTerms(trimmed);
    const seen = new Set<Id<"products">>();
    const scored: Array<{ product: Doc<"products">; merchantSlug: string; score: number }> =
      [];

    for (const merchant of verifiedMerchants) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(100);

      for (const product of products) {
        if (seen.has(product._id)) continue;
        const category = await ctx.db.get(product.categoryId);
        const categoryName = category?.name ?? "";
        const score = scoreProduct(product, categoryName, terms);
        if (score > 0 || terms.length === 0) {
          seen.add(product._id);
          scored.push({ product, merchantSlug: merchant.slug, score });
        }
      }
    }

    if (terms.length > 0) {
      for (const searchQ of [trimmed, ...terms]) {
        if (searchQ.length < 2) continue;
        const hits = await ctx.db
          .query("products")
          .withSearchIndex("search_name", (q) =>
            q.search("name", searchQ).eq("isActive", true),
          )
          .take(limit);
        for (const product of hits) {
          if (seen.has(product._id) || product.merchantId === undefined) continue;
          const merchant = verifiedMerchants.find((m) => m._id === product.merchantId);
          if (!merchant) continue;
          seen.add(product._id);
          const category = await ctx.db.get(product.categoryId);
          scored.push({
            product,
            merchantSlug: merchant.slug,
            score: scoreProduct(product, category?.name ?? "", terms) + 2,
          });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

    const top =
      scored.length > 0
        ? scored.slice(0, limit)
        : (
            await Promise.all(
              verifiedMerchants.flatMap(async (merchant) => {
                const products = await ctx.db
                  .query("products")
                  .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
                  .filter((q) => q.eq(q.field("isActive"), true))
                  .take(limit);
                return products.map((product) => ({
                  product,
                  merchantSlug: merchant.slug,
                  score: 0,
                }));
              }),
            )
          ).flat().slice(0, limit);

    return await Promise.all(
      top.map(({ product, merchantSlug }) => hydrateProduct(ctx, product, merchantSlug)),
    );
  },
});

export const getProduct = internalQuery({
  args: {
    merchantSlug: v.string(),
    productSlug: v.string(),
  },
  returns: v.union(productHitValidator, v.null()),
  handler: async (ctx, args) => {
    const merchant = await getVerifiedMerchant(ctx, args.merchantSlug);
    if (merchant === null) return null;

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
    return await hydrateProduct(ctx, product, merchant.slug);
  },
});

export const listMerchantMenu = internalQuery({
  args: { merchantSlug: v.string() },
  returns: v.array(productHitValidator),
  handler: async (ctx, args) => {
    const merchant = await getVerifiedMerchant(ctx, args.merchantSlug);
    if (merchant === null) return [];

    const products = await ctx.db
      .query("products")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);

    products.sort((a, b) => a.name.localeCompare(b.name));
    return await Promise.all(
      products.map((product) => hydrateProduct(ctx, product, merchant.slug)),
    );
  },
});

export const ASSISTANT_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "search_menu_products",
      description:
        "Search La Parada menu products by dish name, ingredient, or category (tapas, mains, drinks).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search terms, e.g. patatas bravas, seafood, sangria" },
          limit: { type: "number", description: "Max results (default 8)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_product",
      description: "Get full details for one menu item by merchant and product slug.",
      parameters: {
        type: "object",
        properties: {
          merchantSlug: { type: "string", description: "Merchant slug, usually la-parada" },
          productSlug: { type: "string", description: "Product slug, e.g. patatas-bravas" },
        },
        required: ["merchantSlug", "productSlug"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_merchant_menu",
      description: "List all active menu items for a verified merchant.",
      parameters: {
        type: "object",
        properties: {
          merchantSlug: { type: "string", description: "Merchant slug, usually la-parada" },
        },
        required: ["merchantSlug"],
      },
    },
  },
];
