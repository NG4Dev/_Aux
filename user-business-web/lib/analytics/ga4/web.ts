"use client";

import { isAnalyticsEnabled } from "@/lib/analytics/analyticsEnabled";
import {
  classifyUserType,
  toAnalyticsUserType,
  type Persona,
  type UserType,
} from "@/lib/analytics/userClassification";
import {
  Ga4Events,
  type AnalyticsItem,
  type ContentType,
  type OrderKind,
} from "@/lib/analytics/taxonomy";
import { getPersistedUtmsForAnalytics } from "@/lib/analytics/utm";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type Payload = Record<string, string | number | boolean | undefined>;

const GTM_ENABLED =
  isAnalyticsEnabled() &&
  !!process.env.NEXT_PUBLIC_GTM_ID &&
  process.env.NEXT_PUBLIC_ENABLE_GTM !== "false";

export const isGtmEnabled = () =>
  GTM_ENABLED && typeof window !== "undefined";

const withIdentity = (args: {
  userId?: string;
  emailAddress?: string | null;
  userType?: UserType;
  persona?: Persona;
  merchantId?: string;
  merchantSlug?: string;
  merchantType?: string;
  city?: string;
  contentType?: ContentType;
  discoverCategory?: string;
  orderKind?: OrderKind;
  experimentId?: string;
  variant?: string;
  routeGroup?: string;
  funnelStep?: string;
}): Payload => {
  const classified =
    args.userType ??
    (args.emailAddress ? classifyUserType(args.emailAddress) : undefined);
  const userType = classified
    ? toAnalyticsUserType(classified)
    : undefined;

  return {
    user_id: args.userId,
    user_type: userType,
    persona: args.persona,
    merchant_id: args.merchantId,
    merchant_slug: args.merchantSlug,
    merchant_type: args.merchantType,
    city: args.city,
    content_type: args.contentType,
    discover_category: args.discoverCategory,
    order_kind: args.orderKind,
    experiment_id: args.experimentId,
    variant: args.variant,
    route_group: args.routeGroup,
    funnel_step: args.funnelStep,
  };
};

export const pushToDataLayer = (event: string, payload: Payload = {}) => {
  if (!isGtmEnabled()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
};

export const syncGa4User = (args: {
  userId: string;
  emailAddress?: string | null;
  userType?: UserType;
  personaDefault?: Persona;
}) => {
  const classified =
    args.userType ?? classifyUserType(args.emailAddress);
  pushToDataLayer(Ga4Events.Ga4UserSet, {
    user_id: args.userId,
    user_type: toAnalyticsUserType(classified),
    persona_default: args.personaDefault,
  });
};

export const clearGa4User = () => {
  pushToDataLayer(Ga4Events.Ga4UserClear, { user_id: "" });
};

export const trackPageView = (args: {
  pathname: string;
  search?: string;
  title?: string;
  routeGroup: string;
  persona: Persona;
  userId?: string;
  emailAddress?: string | null;
}) => {
  const path = args.pathname || "/";
  const search = args.search
    ? args.search.startsWith("?")
      ? args.search
      : `?${args.search}`
    : "";
  pushToDataLayer(Ga4Events.PageView, {
    page_path: path,
    page_location: `${path}${search}`,
    page_title: args.title,
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      routeGroup: args.routeGroup,
    }),
    ...getPersistedUtmsForAnalytics(),
  });
};

export const trackLogin = (args: {
  userId: string;
  method?: string;
  emailAddress?: string | null;
  persona?: Persona;
}) => {
  pushToDataLayer(Ga4Events.Login, {
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona ?? "consumer",
    }),
    sign_in_method: args.method ?? "unknown",
    ...getPersistedUtmsForAnalytics(),
  });
};

export const trackSignUp = (args: {
  userId: string;
  method?: string;
  emailAddress?: string | null;
  persona?: Persona;
}) => {
  pushToDataLayer(Ga4Events.SignUp, {
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona ?? "consumer",
    }),
    sign_up_method: args.method ?? "unknown",
    ...getPersistedUtmsForAnalytics(),
  });
};

export const trackViewItemList = (args: {
  itemListName: string;
  persona: Persona;
  userId?: string;
  emailAddress?: string | null;
  city?: string;
  discoverCategory?: string;
  contentType?: ContentType;
}) => {
  pushToDataLayer(Ga4Events.ViewItemList, {
    item_list_name: args.itemListName,
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      city: args.city,
      discoverCategory: args.discoverCategory,
      contentType: args.contentType,
      funnelStep: "discover",
    }),
  });
};

export const trackSearch = (args: {
  searchTerm: string;
  persona: Persona;
  userId?: string;
  emailAddress?: string | null;
}) => {
  pushToDataLayer(Ga4Events.Search, {
    search_term: args.searchTerm,
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      funnelStep: "search",
    }),
  });
};

export const trackViewItem = (args: {
  item: AnalyticsItem;
  persona: Persona;
  contentType: ContentType;
  userId?: string;
  emailAddress?: string | null;
  merchantId?: string;
  merchantSlug?: string;
  value?: number;
  currency?: string;
}) => {
  if (!isGtmEnabled()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: Ga4Events.ViewItem,
    ecommerce: {
      currency: args.currency ?? "ZAR",
      value: args.value ?? args.item.price,
      items: [args.item],
    },
    item_id: args.item.item_id,
    item_name: args.item.item_name,
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      contentType: args.contentType,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug ?? args.item.item_brand,
      funnelStep: "view_item",
    }),
  });
};

export const trackAddToCart = (args: {
  items: AnalyticsItem[];
  persona: Persona;
  value: number;
  currency?: string;
  userId?: string;
  emailAddress?: string | null;
  merchantId?: string;
  merchantSlug?: string;
  contentType?: ContentType;
  orderKind?: OrderKind;
}) => {
  if (!isGtmEnabled()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: Ga4Events.AddToCart,
    ecommerce: {
      currency: args.currency ?? "ZAR",
      value: args.value,
      items: args.items,
    },
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      contentType: args.contentType,
      orderKind: args.orderKind,
      funnelStep: "cart",
    }),
  });
};

export const trackBeginCheckout = (args: {
  items: AnalyticsItem[];
  persona: Persona;
  value: number;
  currency?: string;
  userId?: string;
  emailAddress?: string | null;
  merchantId?: string;
  merchantSlug?: string;
  orderKind?: OrderKind;
}) => {
  if (!isGtmEnabled()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: Ga4Events.BeginCheckout,
    ecommerce: {
      currency: args.currency ?? "ZAR",
      value: args.value,
      items: args.items,
    },
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      orderKind: args.orderKind,
      funnelStep: "checkout",
    }),
  });
};

export const trackAddPaymentInfo = (args: {
  persona: Persona;
  paymentType?: string;
  value?: number;
  currency?: string;
  userId?: string;
  emailAddress?: string | null;
  orderKind?: OrderKind;
}) => {
  pushToDataLayer(Ga4Events.AddPaymentInfo, {
    payment_type: args.paymentType ?? "card",
    currency: args.currency ?? "ZAR",
    value: args.value,
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      orderKind: args.orderKind,
      funnelStep: "payment",
    }),
  });
};

export const trackPurchase = (args: {
  transactionId: string;
  value: number;
  items: AnalyticsItem[];
  persona: Persona;
  currency?: string;
  userId?: string;
  emailAddress?: string | null;
  merchantId?: string;
  merchantSlug?: string;
  orderKind?: OrderKind;
}) => {
  if (!isGtmEnabled()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: Ga4Events.Purchase,
    ecommerce: {
      transaction_id: args.transactionId,
      currency: args.currency ?? "ZAR",
      value: args.value,
      items: args.items,
    },
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: args.persona,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      orderKind: args.orderKind,
      funnelStep: "purchase",
    }),
  });
};

export const trackMerchantProfileCompleted = (args: {
  userId: string;
  emailAddress?: string | null;
  merchantId?: string;
  merchantSlug?: string;
  merchantType?: string;
  city?: string;
}) => {
  pushToDataLayer(Ga4Events.MerchantProfileCompleted, {
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: "merchant",
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      merchantType: args.merchantType,
      city: args.city,
      funnelStep: "merchant_profile",
    }),
  });
};

export const trackMerchantListingCreated = (args: {
  userId: string;
  emailAddress?: string | null;
  contentType: ContentType;
  merchantId?: string;
  merchantSlug?: string;
  merchantType?: string;
}) => {
  pushToDataLayer(Ga4Events.MerchantListingCreated, {
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: "merchant",
      contentType: args.contentType,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      merchantType: args.merchantType,
      funnelStep: "merchant_listing",
    }),
  });
};

export const trackMerchantPromoPublished = (args: {
  userId: string;
  emailAddress?: string | null;
  promoType?: string;
  merchantId?: string;
  merchantSlug?: string;
}) => {
  pushToDataLayer(Ga4Events.MerchantPromoPublished, {
    promo_type: args.promoType,
    ...withIdentity({
      userId: args.userId,
      emailAddress: args.emailAddress,
      persona: "merchant",
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      funnelStep: "merchant_promo",
    }),
  });
};
