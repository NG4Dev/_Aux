import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { searchRestaurantMenuProducts } from "./lib/menuProductSearch";
import { runToolCallingChat, type ChatMessage } from "./lib/agentLoop";
import { fetchFireworksWithRetry, COLD_START_BACKOFF_MS } from "./lib/fireworksFetch";
import {
  ASSISTANT_TOOL_DEFINITIONS,
  type AssistantProductHit,
} from "./assistantTools";

const RAG_SEARCH_TIMEOUT_MS = 4_000;
const RAG_HEALTH_TIMEOUT_MS = 2_000;

const modelChoiceValidator = v.union(
  v.literal("qwen-amd"),
  v.literal("gemma-fireworks"),
);

const productCardValidator = v.object({
  productId: v.string(),
  productSlug: v.string(),
  merchantSlug: v.string(),
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.union(v.string(), v.null()),
  priceCents: v.optional(v.number()),
  chunkId: v.optional(v.string()),
  score: v.optional(v.number()),
});

const searchReturns = v.object({
  sessionId: v.id("assistantSessions"),
  candidates: v.array(productCardValidator),
  chunkIds: v.array(v.string()),
  preamble: v.string(),
});

const chatReturns = v.object({
  answer: v.string(),
  productCards: v.array(productCardValidator),
  refinementChips: v.array(v.string()),
  followUps: v.array(v.string()),
  mode: v.literal("agent"),
});

const getModeReturns = v.object({
  mode: v.union(v.literal("agent"), v.literal("hitl")),
  ragHealthy: v.boolean(),
});

type ProductCard = {
  productId: string;
  productSlug: string;
  merchantSlug: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string | null;
  priceCents?: number;
  chunkId?: string;
  score?: number;
};

type RagHit = {
  chunk_id: string;
  product_id?: string | null;
  merchant_slug?: string | null;
  title: string;
  snippet: string;
  score: number;
  metadata?: {
    productId?: string;
    merchantSlug?: string;
    imageUrl?: string;
    priceCents?: number;
    category?: string;
  };
};

const SESSION_TTL_MS = 30 * 60 * 1000;

const synthesizeReturns = v.object({
  answer: v.string(),
  productCards: v.array(productCardValidator),
  refinementChips: v.array(v.string()),
  followUps: v.array(v.string()),
});

function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  if (trimmed.endsWith("/v1")) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}

async function probeRagHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RAG_HEALTH_TIMEOUT_MS);
  try {
    try {
      const resp = await fetch(`${ragBaseUrl()}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      if (resp.ok) return true;
    } catch {
      // fall through to search probe
    }

    const searchResp = await fetch(`${ragBaseUrl()}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "health", project_id: "aux-menu", limit: 1 }),
      signal: controller.signal,
    });
    return searchResp.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function hitToProductCard(hit: AssistantProductHit): ProductCard {
  return {
    productId: hit.productId,
    productSlug: hit.productSlug,
    merchantSlug: hit.merchantSlug,
    title: hit.title,
    subtitle: hit.subtitle,
    description: hit.description,
    imageUrl: hit.imageUrl,
    priceCents: hit.priceCents,
  };
}

function collectProductsFromToolResult(
  name: string,
  result: unknown,
  collected: Map<string, ProductCard>,
): void {
  if (name === "get_product" && result && typeof result === "object") {
    const hit = result as AssistantProductHit;
    if (hit.productSlug) {
      collected.set(`${hit.merchantSlug}:${hit.productSlug}`, hitToProductCard(hit));
    }
    return;
  }
  if (
    (name === "search_menu_products" || name === "list_merchant_menu") &&
    Array.isArray(result)
  ) {
    for (const item of result) {
      if (item && typeof item === "object" && "productSlug" in item) {
        const hit = item as AssistantProductHit;
        collected.set(`${hit.merchantSlug}:${hit.productSlug}`, hitToProductCard(hit));
      }
    }
  }
}

function parseChipsFromAnswer(rawAnswer: string): {
  answer: string;
  refinementChips: string[];
} {
  const [answerPart, chipsPart] = rawAnswer.split("CHIPS:");
  const answer = answerPart.trim();
  const refinementChips = chipsPart
    ? chipsPart
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    : ["More tapas", "Vegetarian", "Under R100"];
  return { answer, refinementChips };
}

function ragBaseUrl(): string {
  return (
    process.env.HOMELAB_RAG_URL ??
    process.env.AMD_GATEWAY_URL ??
    "http://129.212.186.73:8100"
  );
}

function inferenceBaseUrl(modelChoice: "qwen-amd" | "gemma-fireworks"): string {
  if (modelChoice === "gemma-fireworks") {
    return "https://api.fireworks.ai/inference/v1";
  }
  return (
    process.env.AMD_INFERENCE_URL ??
    process.env.AMD_GATEWAY_URL ??
    "http://129.212.186.73:8080"
  );
}

function inferenceModel(modelChoice: "qwen-amd" | "gemma-fireworks"): string {
  if (modelChoice === "gemma-fireworks") {
    // Gemma is on-demand only on Fireworks (not serverless). Set FIREWORKS_MODEL to your
    // deployment path once created, e.g. accounts/<acct>/deployments/<id>
    return (
      process.env.FIREWORKS_MODEL ??
      "accounts/fireworks/models/gemma-4-26b-a4b-it"
    );
  }
  return process.env.AMD_INFERENCE_MODEL ?? "Qwen/Qwen2.5-VL-7B-Instruct";
}

async function requireUserId(ctx: ActionCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("NOT_SIGNED_IN");
  }
  const user = await ctx.runQuery(internal.assistant._getUserByClerkId, {
    clerkUserId: identity.subject,
  });
  if (user === null) {
    throw new Error("User record not found");
  }
  return user._id;
}

async function buildPreferenceSnapshot(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<Record<string, unknown>> {
  const profile = await ctx.runQuery(internal.assistant._getUserProfile, { userId });
  return {
    interestCategoryIds: profile?.interestCategoryIds ?? [],
    interestTags: profile?.interestTags ?? [],
    embeddingDims: profile?.embedding?.length ?? 0,
    dietaryRestrictions: profile?.interestTags?.filter((t: string) =>
      ["fish", "gluten", "dairy", "nuts"].includes(t.toLowerCase()),
    ) ?? [],
  };
}

function hitToCard(hit: RagHit): ProductCard {
  const productId = hit.metadata?.productId ?? hit.product_id ?? hit.chunk_id;
  return {
    productId,
    productSlug: productId,
    merchantSlug: hit.metadata?.merchantSlug ?? hit.merchant_slug ?? "la-parada",
    title: hit.title,
    subtitle: hit.metadata?.category,
    description: hit.snippet,
    imageUrl: hit.metadata?.imageUrl ?? null,
    priceCents: hit.metadata?.priceCents,
    chunkId: hit.chunk_id,
    score: hit.score,
  };
}

export const _getUserByClerkId = internalQuery({
  args: { clerkUserId: v.string() },
  returns: v.union(
    v.object({ _id: v.id("users") }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (user === null) return null;
    return { _id: user._id };
  },
});

export const _getUserProfile = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      interestCategoryIds: v.optional(v.array(v.id("categories"))),
      interestTags: v.optional(v.array(v.string())),
      embedding: v.optional(v.array(v.float64())),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null) return null;
    return {
      interestCategoryIds: user.interestCategoryIds,
      interestTags: user.interestTags,
      embedding: user.embedding,
    };
  },
});

export const _createSession = internalMutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    imageUrl: v.optional(v.string()),
    preferenceSnapshot: v.optional(v.any()),
    candidates: v.array(v.any()),
    chunkIds: v.array(v.string()),
  },
  returns: v.id("assistantSessions"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("assistantSessions", {
      userId: args.userId,
      query: args.query,
      imageUrl: args.imageUrl,
      preferenceSnapshot: args.preferenceSnapshot,
      candidates: args.candidates,
      chunkIds: args.chunkIds,
      status: "awaiting_approval",
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
  },
});

export const _getSession = internalQuery({
  args: { sessionId: v.id("assistantSessions"), userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("assistantSessions"),
      query: v.string(),
      imageUrl: v.optional(v.string()),
      candidates: v.array(v.any()),
      chunkIds: v.array(v.string()),
      status: v.union(
        v.literal("awaiting_approval"),
        v.literal("synthesized"),
        v.literal("expired"),
      ),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== args.userId) {
      return null;
    }
    return {
      _id: session._id,
      query: session.query,
      imageUrl: session.imageUrl,
      candidates: session.candidates,
      chunkIds: session.chunkIds,
      status: session.status,
      expiresAt: session.expiresAt,
    };
  },
});

export const _markSessionSynthesized = internalMutation({
  args: { sessionId: v.id("assistantSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { status: "synthesized" });
    return null;
  },
});

export const _insertTrace = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.optional(v.id("assistantSessions")),
    phase: v.union(v.literal("search"), v.literal("synthesize"), v.literal("chat")),
    provider: v.union(v.literal("amd"), v.literal("fireworks"), v.literal("convex")),
    model: v.string(),
    latencyMs: v.number(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("assistantTraces", {
      ...args,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const _searchProductsFallback = internalQuery({
  args: { query: v.string(), limit: v.number() },
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      priceCents: v.number(),
      imageUrl: v.union(v.string(), v.null()),
      merchantSlug: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    return await searchRestaurantMenuProducts(ctx, args.query, args.limit);
  },
});

type SearchHandlerResult = {
  sessionId: Id<"assistantSessions">;
  candidates: ProductCard[];
  chunkIds: string[];
  preamble: string;
};

export const search = action({
  args: {
    query: v.string(),
    imageUrl: v.optional(v.string()),
  },
  returns: searchReturns,
  handler: async (ctx, args): Promise<SearchHandlerResult> => {
    const started = Date.now();
    const userId = await requireUserId(ctx);
    const preferenceSnapshot = await buildPreferenceSnapshot(ctx, userId);

    let hits: RagHit[] = [];
    let provider: "amd" | "convex" = "amd";
    let ragReachable = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), RAG_SEARCH_TIMEOUT_MS);
      try {
        const ragResp = await fetch(`${ragBaseUrl()}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: args.query,
            project_id: "aux-menu",
            limit: 8,
            user_context: preferenceSnapshot,
          }),
          signal: controller.signal,
        });
        if (ragResp.ok) {
          ragReachable = true;
          const data = (await ragResp.json()) as { hits: RagHit[] };
          hits = data.hits ?? [];
        } else {
          provider = "convex";
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      provider = "convex";
    }

    if (!ragReachable) {
      const fallback = await ctx.runQuery(internal.assistant._searchProductsFallback, {
        query: args.query,
        limit: 8,
      });
      hits = fallback.map(
        (
          p: {
            slug: string;
            name: string;
            description?: string;
            priceCents: number;
            imageUrl: string | null;
            merchantSlug: string;
          },
          idx: number,
        ) => ({
          chunk_id: `convex:${p.slug}`,
          product_id: p.slug,
          merchant_slug: p.merchantSlug,
          title: p.name,
          snippet: p.description ?? p.name,
          score: 1 - idx * 0.05,
          metadata: {
            productId: p.slug,
            merchantSlug: p.merchantSlug,
            imageUrl: p.imageUrl ?? undefined,
            priceCents: p.priceCents,
          },
        }),
      );
      provider = "convex";
    }

    const candidates = hits.map(hitToCard);
    const chunkIds = hits.map((h) => h.chunk_id);

    const sessionId: Id<"assistantSessions"> = await ctx.runMutation(
      internal.assistant._createSession,
      {
      userId,
      query: args.query,
      imageUrl: args.imageUrl,
      preferenceSnapshot,
      candidates,
      chunkIds,
    },
    );

    await ctx.runMutation(internal.assistant._insertTrace, {
      userId,
      sessionId,
      phase: "search",
      provider,
      model: "rag-search",
      latencyMs: Date.now() - started,
      metadata: { hitCount: hits.length },
    });

    const preamble =
      hits.length > 0
        ? `I found ${hits.length} menu items that might match. Tap the ones that look right, then confirm.`
        : "I couldn't find close matches. Try a different ingredient or dish name.";

    return { sessionId, candidates, chunkIds, preamble };
  },
});

type SynthesizeHandlerResult = {
  answer: string;
  productCards: ProductCard[];
  refinementChips: string[];
  followUps: string[];
};

export const synthesize = action({
  args: {
    sessionId: v.id("assistantSessions"),
    approvedChunkIds: v.array(v.string()),
    approvedProductIds: v.array(v.string()),
    modelChoice: v.optional(modelChoiceValidator),
  },
  returns: synthesizeReturns,
  handler: async (ctx, args): Promise<SynthesizeHandlerResult> => {
    const started = Date.now();
    const userId = await requireUserId(ctx);
    const modelChoice =
      args.modelChoice ??
      (process.env.FIREWORKS_API_KEY ? "gemma-fireworks" : "qwen-amd");

    const session = await ctx.runQuery(internal.assistant._getSession, {
      sessionId: args.sessionId,
      userId,
    });
    if (session === null) {
      throw new Error("Session not found");
    }
    if (session.expiresAt < Date.now()) {
      throw new Error("Session expired");
    }
    if (session.status !== "awaiting_approval") {
      throw new Error("Session already synthesized");
    }

    const approvedChunks = new Set(args.approvedChunkIds);
    const approvedProducts = new Set(args.approvedProductIds);
    const candidates = (session.candidates as ProductCard[]).filter(
      (c) =>
        (c.chunkId && approvedChunks.has(c.chunkId)) ||
        approvedProducts.has(c.productId) ||
        approvedProducts.has(c.productSlug),
    );

    const contextLines = candidates.map(
      (c) => `- ${c.title}: ${c.description ?? ""} (${c.merchantSlug})`,
    );
    const systemPrompt =
      "You are AUX menu assistant. Recommend dishes from approved sources only. Be concise.";
    const userPrompt = [
      `User query: ${session.query}`,
      "",
      "Approved menu context:",
      contextLines.length ? contextLines.join("\n") : "(none approved)",
      "",
      "Respond with a short helpful answer and suggest 2-3 refinement chip labels at the end as: CHIPS: chip1 | chip2 | chip3",
    ].join("\n");

    const baseUrl = inferenceBaseUrl(modelChoice);
    const model = inferenceModel(modelChoice);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (modelChoice === "gemma-fireworks") {
      const key = process.env.FIREWORKS_API_KEY;
      if (!key) throw new Error("FIREWORKS_API_KEY not configured");
      headers.Authorization = `Bearer ${key}`;
    }

    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: systemPrompt },
    ];
    if (session.imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: session.imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const llmResp = await fetchFireworksWithRetry(chatCompletionsUrl(baseUrl), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 300,
      }),
    });
    const llmJson = (await llmResp.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const rawAnswer = llmJson.choices[0]?.message?.content ?? "";
    const [answerPart, chipsPart] = rawAnswer.split("CHIPS:");
    const answer = answerPart.trim();
    const refinementChips = chipsPart
      ? chipsPart
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
      : ["More tapas", "Vegetarian", "Under R100"];

    const followUps = [
      "Show gluten-free options",
      "What's popular tonight?",
      "Pair with a drink",
    ];

    await ctx.runMutation(internal.assistant._markSessionSynthesized, {
      sessionId: args.sessionId,
    });
    await ctx.runMutation(internal.assistant._insertTrace, {
      userId,
      sessionId: args.sessionId,
      phase: "synthesize",
      provider: modelChoice === "gemma-fireworks" ? "fireworks" : "amd",
      model,
      latencyMs: Date.now() - started,
      inputTokens: llmJson.usage?.prompt_tokens,
      outputTokens: llmJson.usage?.completion_tokens,
      metadata: { approvedCount: candidates.length },
    });

    return {
      answer,
      productCards: candidates,
      refinementChips,
      followUps,
    };
  },
});

export const getMode = action({
  args: {},
  returns: getModeReturns,
  handler: async (): Promise<{ mode: "agent" | "hitl"; ragHealthy: boolean }> => {
    const ragHealthy = await probeRagHealth();
    return {
      mode: ragHealthy ? "hitl" : "agent",
      ragHealthy,
    };
  },
});

const warmGemmaReturns = v.object({
  ok: v.boolean(),
  latencyMs: v.number(),
});

/** Ping Fireworks so GPUs scale up before the user sends a chat message. */
export const warmGemma = action({
  args: {},
  returns: warmGemmaReturns,
  handler: async (): Promise<{ ok: boolean; latencyMs: number }> => {
    const started = Date.now();
    const key = process.env.FIREWORKS_API_KEY;
    if (!key) {
      return { ok: false, latencyMs: 0 };
    }

    try {
      const resp = await fetchFireworksWithRetry(
        chatCompletionsUrl(inferenceBaseUrl("gemma-fireworks")),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: inferenceModel("gemma-fireworks"),
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        },
        { backoffMs: COLD_START_BACKOFF_MS },
      );
      await resp.json();
      return { ok: true, latencyMs: Date.now() - started };
    } catch (error) {
      console.warn("warmGemma failed:", error);
      return { ok: false, latencyMs: Date.now() - started };
    }
  },
});

type ChatHandlerResult = {
  answer: string;
  productCards: ProductCard[];
  refinementChips: string[];
  followUps: string[];
  mode: "agent";
};

export const chat = action({
  args: {
    query: v.string(),
    imageUrl: v.optional(v.string()),
    modelChoice: v.optional(modelChoiceValidator),
    conversationId: v.optional(v.string()),
  },
  returns: chatReturns,
  handler: async (ctx, args): Promise<ChatHandlerResult> => {
    const started = Date.now();
    const userId = await requireUserId(ctx);
    const modelChoice =
      args.modelChoice ??
      (process.env.FIREWORKS_API_KEY ? "gemma-fireworks" : "qwen-amd");

    const collectedProducts = new Map<string, ProductCard>();
    const executeTool = async (name: string, toolArgs: Record<string, unknown>) => {
      let result: unknown;
      switch (name) {
        case "search_menu_products":
          result = await ctx.runQuery(internal.assistantTools.searchMenuProducts, {
            query: String(toolArgs.query ?? ""),
            limit:
              typeof toolArgs.limit === "number" ? toolArgs.limit : undefined,
          });
          break;
        case "get_product":
          result = await ctx.runQuery(internal.assistantTools.getProduct, {
            merchantSlug: String(toolArgs.merchantSlug ?? "la-parada"),
            productSlug: String(toolArgs.productSlug ?? ""),
          });
          break;
        case "list_merchant_menu":
          result = await ctx.runQuery(internal.assistantTools.listMerchantMenu, {
            merchantSlug: String(toolArgs.merchantSlug ?? "la-parada"),
          });
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }
      collectProductsFromToolResult(name, result, collectedProducts);
      return result;
    };

    const systemPrompt = [
      "You are the AUX menu assistant for La Parada tapas bar in Cape Town.",
      "Always use the provided tools to look up live menu data before answering.",
      "Only recommend dishes that appear in tool results — never invent menu items.",
      "If nothing matches, say so honestly and suggest real alternatives from the menu.",
      "Keep answers concise (2-4 sentences).",
      "End with refinement chips on a new line: CHIPS: chip1 | chip2 | chip3",
    ].join(" ");

    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
    if (args.imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: args.query },
          { type: "image_url", image_url: { url: args.imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: args.query });
    }

    const baseUrl = inferenceBaseUrl(modelChoice);
    const model = inferenceModel(modelChoice);
    const apiKey =
      modelChoice === "gemma-fireworks" ? process.env.FIREWORKS_API_KEY : undefined;
    if (modelChoice === "gemma-fireworks" && !apiKey) {
      throw new Error("FIREWORKS_API_KEY not configured");
    }

    const { answer: rawAnswer, usage, rounds } = await runToolCallingChat({
      baseUrl,
      apiKey,
      model,
      messages,
      tools: ASSISTANT_TOOL_DEFINITIONS,
      maxRounds: 4,
      executeTool,
    });

    const { answer, refinementChips } = parseChipsFromAnswer(rawAnswer);
    const productCards = [...collectedProducts.values()].slice(0, 8);
    const followUps = [
      "What tapas do you recommend?",
      "Show me drinks",
      "What's in patatas bravas?",
    ];

    await ctx.runMutation(internal.assistant._insertTrace, {
      userId,
      phase: "chat",
      provider: modelChoice === "gemma-fireworks" ? "fireworks" : "amd",
      model,
      latencyMs: Date.now() - started,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      metadata: {
        rounds,
        productCount: productCards.length,
        conversationId: args.conversationId,
      },
    });

    return {
      answer,
      productCards,
      refinementChips,
      followUps,
      mode: "agent",
    };
  },
});
