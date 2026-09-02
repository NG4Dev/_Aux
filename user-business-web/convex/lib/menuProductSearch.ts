import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const STOP_WORDS = new Set([
  "i",
  "want",
  "something",
  "to",
  "the",
  "a",
  "an",
  "hi",
  "hello",
  "hey",
  "please",
  "get",
  "me",
  "some",
  "any",
  "for",
  "and",
  "or",
  "what",
  "do",
  "you",
  "have",
  "like",
  "would",
  "could",
]);

/** Maps foodie terms to menu category slugs in seeded data. */
const CATEGORY_TERMS: Record<string, string[]> = {
  tapas: ["tapas", "small", "plates", "starter", "starters", "croqueta", "croquetas"],
  drinks: [
    "drink",
    "drinks",
    "cocktail",
    "cocktails",
    "sangria",
    "wine",
    "beer",
    "thirsty",
    "beverage",
    "spritz",
  ],
  mains: [
    "main",
    "mains",
    "burger",
    "burgers",
    "food",
    "eat",
    "hungry",
    "paella",
    "seafood",
    "prawn",
    "prawns",
    "fish",
    "linefish",
    "grill",
  ],
};

export type MenuSearchHit = {
  slug: string;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl: string | null;
  merchantSlug: string;
};

function extractTerms(query: string): string[] {
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = normalized
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

function matchingCategorySlugs(terms: string[]): Set<string> {
  const slugs = new Set<string>();
  const joined = terms.join(" ");
  for (const [slug, aliases] of Object.entries(CATEGORY_TERMS)) {
    if (aliases.some((alias) => joined.includes(alias) || terms.includes(alias))) {
      slugs.add(slug);
    }
  }
  return slugs;
}

export async function searchRestaurantMenuProducts(
  ctx: QueryCtx,
  query: string,
  limit: number,
): Promise<MenuSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const merchants = await ctx.db
    .query("merchants")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .take(200);
  const restaurantMerchants = merchants.filter((m) => m.type === "restaurant");
  const merchantById = new Map(restaurantMerchants.map((m) => [m._id, m]));

  const terms = extractTerms(trimmed);
  const categorySlugs = matchingCategorySlugs(
    terms.length > 0 ? terms : [trimmed.toLowerCase().replace(/[^\w]/g, "")],
  );
  const seen = new Set<Id<"products">>();
  const merged: Doc<"products">[] = [];

  const tryAdd = (p: Doc<"products">) => {
    if (seen.has(p._id)) return;
    if (p.merchantId === undefined || !merchantById.has(p.merchantId)) return;
    if (!p.isActive) return;
    seen.add(p._id);
    merged.push(p);
  };

  const searchQueries = [trimmed, ...terms].filter(
    (value, index, arr) => arr.indexOf(value) === index,
  );
  for (const searchQ of searchQueries) {
    if (merged.length >= limit || searchQ.length < 2) continue;
    const hits = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) =>
        q.search("name", searchQ).eq("isActive", true),
      )
      .take(limit);
    for (const p of hits) tryAdd(p);
  }

  for (const catSlug of categorySlugs) {
    if (merged.length >= limit) break;
    const cat = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", catSlug))
      .first();
    if (!cat) continue;
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", cat._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);
    for (const p of products) {
      tryAdd(p);
      if (merged.length >= limit) break;
    }
  }

  if (merged.length < limit) {
    const needles = terms.length > 0 ? terms : [trimmed.toLowerCase()];
    for (const merchant of restaurantMerchants) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(80);
      for (const p of products) {
        if (merged.length >= limit) break;
        const haystack = `${p.name} ${p.description}`.toLowerCase();
        if (needles.some((needle) => haystack.includes(needle))) tryAdd(p);
      }
      if (merged.length >= limit) break;
    }
  }

  if (merged.length === 0) {
    for (const merchant of restaurantMerchants) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(limit);
      for (const p of products) tryAdd(p);
      if (merged.length >= limit) break;
    }
  }

  return await Promise.all(
    merged.slice(0, limit).map(async (p) => {
      const merchant = merchantById.get(p.merchantId!)!;
      return {
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageStorageId
          ? await ctx.storage.getUrl(p.imageStorageId)
          : null,
        merchantSlug: merchant.slug,
      };
    }),
  );
}
