import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const addressValidator = v.object({
  fullName: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  region: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phone: v.optional(v.string()),
});

export const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("fulfilled"),
  v.literal("cancelled"),
);

export const orderKindValidator = v.union(
  v.literal("product"),
  v.literal("ticket"),
  v.literal("bundle"),
  v.literal("resale"),
);

export const userRoleValidator = v.union(
  v.literal("admin"),
  v.literal("platformAdmin"),
  v.literal("merchantOwner"),
);

export const merchantTypeValidator = v.union(
  v.literal("restaurant"),
  v.literal("retail"),
  v.literal("event_organizer"),
  v.literal("other"),
);

export const ticketTierValidator = v.union(
  v.literal("GA"),
  v.literal("VIP"),
  v.literal("Other"),
);

export const refundPolicyValidator = v.union(
  v.literal("standard"),
  v.literal("custom"),
  v.literal("no_refunds"),
);

export const guestListStatusValidator = v.union(
  v.literal("confirmed"),
  v.literal("pending"),
  v.literal("declined"),
);

export const waitingListStatusValidator = v.union(
  v.literal("waiting"),
  v.literal("offered"),
  v.literal("purchased"),
  v.literal("expired"),
);

export const ticketInstanceStatusValidator = v.union(
  v.literal("valid"),
  v.literal("used"),
  v.literal("refunded"),
  v.literal("cancelled"),
  v.literal("listed_for_resale"),
);

export const escrowStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const packageItemKindValidator = v.union(
  v.literal("product"),
  v.literal("ticketType"),
);

export const merchantMemberRoleValidator = v.union(
  v.literal("owner"),
  v.literal("staff"),
);

export const mediaAspectValidator = v.union(
  v.literal("square"),
  v.literal("portrait45"),
  v.literal("portrait34"),
  v.literal("landscape"),
  v.literal("story"),
);

export const placeKindValidator = v.union(
  v.literal("venue"),
  v.literal("other"),
);

export const fulfillmentTypeValidator = v.union(
  v.literal("delivery"),
  v.literal("pickup"),
);

export const notificationSettingsValidator = v.object({
  pushEnabled: v.boolean(),
  marketing: v.optional(v.boolean()),
  orderUpdates: v.optional(v.boolean()),
  handledAt: v.optional(v.number()),
});

export const pushTokenValidator = v.object({
  token: v.string(),
  platform: v.union(v.literal("ios"), v.literal("android")),
  updatedAt: v.number(),
});

export const userInteractionEntityValidator = v.union(
  v.literal("product"),
  v.literal("merchant"),
  v.literal("event"),
);

export const userInteractionActionValidator = v.union(
  v.literal("view"),
  v.literal("favorite"),
  v.literal("purchase"),
);

export const locationValidator = v.object({
  address: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
});

export const feedBadgeValidator = v.object({
  label: v.string(),
  color: v.string(),
});

export const operatingStatusValidator = v.union(
  v.literal("open"),
  v.literal("closed"),
  v.literal("upcoming"),
  v.literal("live"),
);

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.optional(userRoleValidator),
    stripeCustomerId: v.optional(v.string()),
    stripeConnectId: v.optional(v.string()),
    address: v.optional(addressValidator),
    dateOfBirth: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.number()),
    onboardingSteps: v.optional(v.array(v.string())),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
    interestTags: v.optional(v.array(v.string())),
    notificationSettings: v.optional(notificationSettingsValidator),
    pushTokens: v.optional(v.array(pushTokenValidator)),
    embedding: v.optional(v.array(v.float64())),
    embeddingUpdatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    }),

  userInteractions: defineTable({
    userId: v.id("users"),
    entityType: userInteractionEntityValidator,
    entityId: v.string(),
    action: userInteractionActionValidator,
    weight: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  merchantMembers: defineTable({
    merchantId: v.id("merchants"),
    userId: v.id("users"),
    role: merchantMemberRoleValidator,
    createdAt: v.number(),
  })
    .index("by_merchant", ["merchantId"])
    .index("by_user", ["userId"])
    .index("by_merchant_and_user", ["merchantId", "userId"]),

  merchants: defineTable({
    ownerUserId: v.id("users"),
    slug: v.string(),
    name: v.string(),
    tagline: v.optional(v.string()),
    type: merchantTypeValidator,
    description: v.optional(v.string()),
    location: v.optional(locationValidator),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    linkedPlaceId: v.optional(v.id("places")),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
    feedCategories: v.optional(v.array(v.string())),
    /** Discover home tile slugs for filtered feeds (e.g. beach-bars). */
    discoverCategorySlugs: v.optional(v.array(v.string())),
    feedBadge: v.optional(feedBadgeValidator),
    operatingStatus: v.optional(operatingStatusValidator),
    stripeConnectId: v.optional(v.string()),
    isActive: v.boolean(),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerUserId"])
    .index("by_active", ["isActive"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["isActive", "type"],
    }),

  places: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(locationValidator),
    placeKind: placeKindValidator,
    linkedMerchantId: v.optional(v.id("merchants")),
    ownerUserId: v.optional(v.id("users")),
    coverStorageId: v.optional(v.id("_storage")),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    mediaAspect: v.optional(mediaAspectValidator),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
    feedCategories: v.optional(v.array(v.string())),
    discoverCategorySlugs: v.optional(v.array(v.string())),
    feedBadge: v.optional(feedBadgeValidator),
    operatingStatus: v.optional(operatingStatusValidator),
    isActive: v.boolean(),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["isActive", "placeKind"],
    }),

  artists: defineTable({
    slug: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    genre: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  eventPerformers: defineTable({
    eventId: v.id("events"),
    artistId: v.id("artists"),
    sortOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_artist", ["artistId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    tileColor: v.optional(v.string()),
    sortOrder: v.number(),
    /** Onboarding/discover grouping, e.g. "Eating & Drinking". */
    discoverGroup: v.optional(v.string()),
    /** When true, shown on Discover home grid tiles. */
    showOnDiscoverHome: v.optional(v.boolean()),
    /** Text embedding for interest-only categories (before catalog exists). */
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_slug", ["slug"])
    .index("by_sortOrder", ["sortOrder"]),

  products: defineTable({
    merchantId: v.optional(v.id("merchants")),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    priceCents: v.number(),
    currency: v.string(),
    categoryId: v.id("categories"),
    imageStorageId: v.optional(v.id("_storage")),
    mediaAspect: v.optional(mediaAspectValidator),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
    stock: v.number(),
    unit: v.string(),
    productKind: v.optional(v.string()),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
    feedCategories: v.optional(v.array(v.string())),
    discoverCategorySlugs: v.optional(v.array(v.string())),
    feedBadge: v.optional(feedBadgeValidator),
    feedHighlight: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdAt: v.number(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_merchant", ["merchantId"])
    .index("by_active", ["isActive"])
    .index("by_feed_highlight", ["feedHighlight", "isActive"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["categoryId", "isActive", "merchantId"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["isActive", "categoryId", "merchantId"],
    }),

  events: defineTable({
    merchantId: v.id("merchants"),
    organizerMerchantId: v.optional(v.id("merchants")),
    hostMerchantId: v.optional(v.id("merchants")),
    venuePlaceId: v.optional(v.id("places")),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    inAppTicketing: v.boolean(),
    externalTicketingUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    mediaAspect: v.optional(mediaAspectValidator),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
    feedCategories: v.optional(v.array(v.string())),
    discoverCategorySlugs: v.optional(v.array(v.string())),
    feedBadge: v.optional(feedBadgeValidator),
    chyron: v.optional(v.string()),
    isCancelled: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_merchant", ["merchantId"])
    .index("by_slug", ["slug"])
    .index("by_startTime", ["startTime"]),

  posts: defineTable({
    merchantId: v.id("merchants"),
    slug: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    caption: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    mediaAspect: v.optional(mediaAspectValidator),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    interestCategoryIds: v.optional(v.array(v.id("categories"))),
    feedCategories: v.optional(v.array(v.string())),
    discoverCategorySlugs: v.optional(v.array(v.string())),
    feedBadge: v.optional(feedBadgeValidator),
    operatingStatus: v.optional(operatingStatusValidator),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_merchant", ["merchantId"])
    .index("by_active", ["isActive"]),

  ticketTypes: defineTable({
    eventId: v.id("events"),
    tier: ticketTierValidator,
    name: v.string(),
    priceCents: v.number(),
    currency: v.string(),
    capacity: v.number(),
    soldCount: v.number(),
    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
    refundPolicy: refundPolicyValidator,
    isActive: v.boolean(),
  })
    .index("by_event", ["eventId"]),

  guestListEntries: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: guestListStatusValidator,
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  waitingListEntries: defineTable({
    ticketTypeId: v.id("ticketTypes"),
    userId: v.id("users"),
    status: waitingListStatusValidator,
    offerExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_ticket_type_status", ["ticketTypeId", "status"])
    .index("by_user", ["userId"])
    .index("by_user_and_ticket_type", ["userId", "ticketTypeId"]),

  ticketPackages: defineTable({
    merchantId: v.id("merchants"),
    eventId: v.optional(v.id("events")),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    priceCents: v.number(),
    currency: v.string(),
    ticketQuantity: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_merchant", ["merchantId"])
    .index("by_slug", ["slug"]),

  packageItems: defineTable({
    packageId: v.id("ticketPackages"),
    itemKind: packageItemKindValidator,
    refId: v.string(),
    quantity: v.number(),
  }).index("by_package", ["packageId"]),

  ticketInstances: defineTable({
    ticketTypeId: v.id("ticketTypes"),
    orderId: v.optional(v.id("orders")),
    ownerUserId: v.id("users"),
    status: ticketInstanceStatusValidator,
    qrPayload: v.string(),
    transferable: v.boolean(),
    purchasedAt: v.number(),
    paymentIntentId: v.optional(v.string()),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_ticket_type", ["ticketTypeId"])
    .index("by_order", ["orderId"]),

  ticketResales: defineTable({
    ticketInstanceId: v.id("ticketInstances"),
    sellerUserId: v.id("users"),
    buyerUserId: v.optional(v.id("users")),
    resalePriceCents: v.number(),
    currency: v.string(),
    escrowStatus: escrowStatusValidator,
    stripePaymentIntentId: v.optional(v.string()),
    listedAt: v.number(),
    soldAt: v.optional(v.number()),
  })
    .index("by_seller", ["sellerUserId"])
    .index("by_buyer", ["buyerUserId"])
    .index("by_ticket_instance", ["ticketInstanceId"])
    .index("by_escrow_status", ["escrowStatus"]),

  favorites: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    merchantId: v.optional(v.id("merchants")),
    orderKind: v.optional(orderKindValidator),
    ticketTypeId: v.optional(v.id("ticketTypes")),
    ticketQuantity: v.optional(v.number()),
    resaleId: v.optional(v.id("ticketResales")),
    status: orderStatusValidator,
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    subtotalCents: v.number(),
    shippingCents: v.number(),
    totalCents: v.number(),
    currency: v.string(),
    hadFreeShipping: v.boolean(),
    shippingAddress: addressValidator,
    fulfillmentType: v.optional(fulfillmentTypeValidator),
    scheduledDeliveryAt: v.optional(v.number()),
    promoCodeId: v.optional(v.id("promoCodes")),
    membershipApplied: v.optional(v.boolean()),
    reservedUntil: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_merchant", ["merchantId"])
    .index("by_status", ["status"])
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_reservedUntil", ["reservedUntil"])
    .index("by_order_kind", ["orderKind"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    nameSnapshot: v.string(),
    priceCentsSnapshot: v.number(),
    quantity: v.number(),
  }).index("by_order", ["orderId"]),

  promoCodes: defineTable({
    code: v.string(),
    merchantId: v.optional(v.id("merchants")),
    discountType: v.union(v.literal("percent"), v.literal("fixed")),
    amount: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  memberships: defineTable({
    userId: v.id("users"),
    tier: v.string(),
    activeUntil: v.number(),
    benefits: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  walletBalances: defineTable({
    userId: v.id("users"),
    balanceCents: v.number(),
    currency: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  assistantSessions: defineTable({
    userId: v.id("users"),
    query: v.string(),
    imageUrl: v.optional(v.string()),
    preferenceSnapshot: v.optional(v.any()),
    candidates: v.array(v.any()),
    chunkIds: v.array(v.string()),
    status: v.union(
      v.literal("awaiting_approval"),
      v.literal("synthesized"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  assistantTraces: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("assistantSessions")),
    phase: v.union(v.literal("search"), v.literal("synthesize"), v.literal("chat")),
    provider: v.union(v.literal("amd"), v.literal("fireworks"), v.literal("convex")),
    model: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    latencyMs: v.number(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
