import { v } from "convex/values";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const EMBEDDING_MODEL = "text-embedding-3-small";

function composeEmbeddingText(input: {
  name: string;
  description: string;
  address: string;
  placeKind: string;
}): string {
  return [
    input.name,
    input.description,
    input.address ? `Address: ${input.address}` : "",
    `Kind: ${input.placeKind}`,
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

export const _getPlaceForEmbedding = internalQuery({
  args: { placeId: v.id("places") },
  returns: v.union(
    v.object({
      name: v.string(),
      description: v.string(),
      address: v.string(),
      placeKind: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (place === null) {
      return null;
    }
    return {
      name: place.name,
      description: place.description ?? "",
      address: place.location?.address ?? "",
      placeKind: place.placeKind,
    };
  },
});

export const _setEmbedding = internalMutation({
  args: {
    placeId: v.id("places"),
    embedding: v.array(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (place === null) {
      return null;
    }
    await ctx.db.patch(args.placeId, { embedding: args.embedding });
    return null;
  },
});

export const _listPlaceIdsMissingEmbedding = internalQuery({
  args: {},
  returns: v.array(v.id("places")),
  handler: async (ctx) => {
    const places = await ctx.db.query("places").collect();
    return places.filter((p) => p.embedding === undefined).map((p) => p._id);
  },
});

export const _listAllPlaceIds = internalQuery({
  args: {},
  returns: v.array(v.id("places")),
  handler: async (ctx) => {
    const places = await ctx.db.query("places").collect();
    return places.map((p) => p._id);
  },
});

export const generateForPlace = internalAction({
  args: { placeId: v.id("places") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const place = await ctx.runQuery(
      internal.embeddingsPlaces._getPlaceForEmbedding,
      { placeId: args.placeId },
    );
    if (place === null) {
      return null;
    }
    const text = composeEmbeddingText(place);
    if (text.length === 0) {
      return null;
    }

    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: text,
    });

    await ctx.runMutation(internal.embeddingsPlaces._setEmbedding, {
      placeId: args.placeId,
      embedding,
    });
    return null;
  },
});

export const backfillAll = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx, args): Promise<{ scheduled: number }> => {
    const ids: Array<Id<"places">> = args.force
      ? await ctx.runQuery(internal.embeddingsPlaces._listAllPlaceIds, {})
      : await ctx.runQuery(
          internal.embeddingsPlaces._listPlaceIdsMissingEmbedding,
          {},
        );

    for (const placeId of ids) {
      await ctx.scheduler.runAfter(
        0,
        internal.embeddingsPlaces.generateForPlace,
        { placeId },
      );
    }
    return { scheduled: ids.length };
  },
});
