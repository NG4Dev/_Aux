import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { feedBadgeValidator, mediaAspectValidator, operatingStatusValidator } from "../schema";

export const feedMediaItemValidator = v.object({
  uri: v.string(),
  type: v.union(v.literal("image"), v.literal("video")),
  width: v.number(),
  height: v.number(),
  aspect: v.optional(
    v.union(
      v.literal("square"),
      v.literal("landscape"),
      v.literal("portrait"),
      v.literal("portrait45"),
      v.literal("portrait34"),
      v.literal("story"),
    ),
  ),
});

export const feedCardValidator = v.object({
  kind: v.union(
    v.literal("product"),
    v.literal("merchant"),
    v.literal("place"),
    v.literal("event"),
    v.literal("post"),
  ),
  contentType: v.union(
    v.literal("place"),
    v.literal("event"),
    v.literal("product"),
    v.literal("post"),
  ),
  id: v.string(),
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.optional(v.string()),
  media: v.array(feedMediaItemValidator),
  badge: v.optional(feedBadgeValidator),
  status: v.optional(operatingStatusValidator),
  chyron: v.optional(v.string()),
  profileName: v.string(),
  profileAvatar: v.union(v.string(), v.null()),
  merchantSlug: v.optional(v.string()),
  productSlug: v.optional(v.string()),
  businessId: v.optional(v.string()),
  categories: v.array(v.string()),
  verified: v.optional(v.boolean()),
  personalized: v.boolean(),
  score: v.optional(v.number()),
});

export type FeedMediaItem = {
  uri: string;
  type: "image" | "video";
  width: number;
  height: number;
  aspect?:
    | "square"
    | "landscape"
    | "portrait"
    | "portrait45"
    | "portrait34"
    | "story";
};

export type FeedCard = {
  kind: "product" | "merchant" | "place" | "event" | "post";
  contentType: "place" | "event" | "product" | "post";
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  media: FeedMediaItem[];
  badge?: { label: string; color: string };
  status?: "open" | "closed" | "upcoming" | "live";
  chyron?: string;
  profileName: string;
  profileAvatar: string | null;
  merchantSlug?: string;
  productSlug?: string;
  businessId?: string;
  categories: string[];
  verified?: boolean;
  personalized: boolean;
  score?: number;
};

export function mapMediaAspect(
  aspect?: "square" | "portrait45" | "portrait34" | "landscape" | "story",
): FeedMediaItem["aspect"] {
  if (aspect === "portrait45") return "portrait";
  return aspect;
}

export async function storageUrls(
  ctx: QueryCtx,
  ids: Id<"_storage">[] | undefined,
): Promise<string[]> {
  if (!ids?.length) return [];
  const urls = await Promise.all(ids.map((id) => ctx.storage.getUrl(id)));
  return urls.filter((url): url is string => url !== null);
}

export async function buildMediaFromStorage(
  ctx: QueryCtx,
  args: {
    primaryId?: Id<"_storage">;
    galleryIds?: Id<"_storage">[];
    mediaAspect?: "square" | "portrait45" | "portrait34" | "landscape" | "story";
    imageWidth?: number;
    imageHeight?: number;
    fallbackUrl?: string | null;
  },
): Promise<FeedMediaItem[]> {
  const items: FeedMediaItem[] = [];
  const width = args.imageWidth ?? 1080;
  const height = args.imageHeight ?? 1080;
  const aspect = mapMediaAspect(args.mediaAspect);

  if (args.primaryId) {
    const url = await ctx.storage.getUrl(args.primaryId);
    if (url) {
      items.push({ uri: url, type: "image", width, height, aspect });
    }
  } else if (args.fallbackUrl) {
    items.push({ uri: args.fallbackUrl, type: "image", width, height, aspect });
  }

  const galleryUrls = await storageUrls(ctx, args.galleryIds);
  for (const uri of galleryUrls) {
    items.push({ uri, type: "image", width: 1080, height: 1080, aspect: "square" });
  }

  return items;
}

export function avatarFor(seed: string): string {
  return `https://i.pravatar.cc/80?u=${encodeURIComponent(seed)}`;
}
