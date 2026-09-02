import { Platform } from "react-native";
import { isAnalyticsEnabled } from "@/services/analytics/analyticsEnabled";
import {
  classifyUserType,
  toAnalyticsUserType,
  type Persona,
  type UserType,
} from "@/services/analytics/userClassification";
import {
  Ga4Events,
  type AnalyticsItem,
  type ContentType,
  type OrderKind,
} from "@/services/analytics/taxonomy";

type Params = Record<string, string | number | boolean | undefined>;

type FirebaseAnalyticsModule = {
  (): {
    logEvent: (name: string, params?: Record<string, string | number>) => void;
    logScreenView: (params: {
      screen_name: string;
      screen_class?: string;
    }) => void;
    setUserId: (id: string | null) => void;
    setUserProperty: (name: string, value: string | null) => void;
    setAnalyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  };
};

let collectionConfigured = false;
let currentUserId: string | null = null;

function getFirebaseAnalytics(): FirebaseAnalyticsModule | null {
  if (Platform.OS === "web") return null;
  try {
    // Native module — requires dev client + google-services files after prebuild.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-firebase/analytics").default;
  } catch {
    return null;
  }
}

async function ensureCollectionEnabled() {
  if (collectionConfigured || !isAnalyticsEnabled()) return;
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;
  await analytics().setAnalyticsCollectionEnabled(true);
  collectionConfigured = true;
}

function sanitizeParams(params: Params): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") {
      out[key] = value ? 1 : 0;
    } else if (typeof value === "number") {
      out[key] = value;
    } else {
      const s = String(value);
      out[key] = s.length > 100 ? s.slice(0, 100) : s;
    }
  }
  return out;
}

async function sendGa4Event(name: string, params: Params = {}) {
  if (!isAnalyticsEnabled()) return;
  await ensureCollectionEnabled();
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;

  const payload = sanitizeParams({
    ...params,
    platform: Platform.OS,
  });

  try {
    if (name === Ga4Events.ScreenView && payload.screen_name) {
      await analytics().logScreenView({
        screen_name: String(payload.screen_name),
        screen_class: String(payload.screen_name),
      });
    }
    await analytics().logEvent(name, payload);
  } catch (error) {
    console.warn("Firebase Analytics logEvent failed", error);
  }
}

const withIdentity = (args: {
  persona?: Persona;
  emailAddress?: string | null;
  userType?: UserType;
  merchantId?: string;
  merchantSlug?: string;
  contentType?: ContentType;
  discoverCategory?: string;
  orderKind?: OrderKind;
  city?: string;
  funnelStep?: string;
}): Params => {
  const classified =
    args.userType ??
    (args.emailAddress ? classifyUserType(args.emailAddress) : undefined);
  return {
    user_type: classified ? toAnalyticsUserType(classified) : undefined,
    persona: args.persona,
    merchant_id: args.merchantId,
    merchant_slug: args.merchantSlug,
    content_type: args.contentType,
    discover_category: args.discoverCategory,
    order_kind: args.orderKind,
    city: args.city,
    funnel_step: args.funnelStep,
  };
};

/** Clerk User-ID + user_type for GA4 (Firebase Analytics → same property as web). */
export const setGa4UserId = (
  userId: string | null,
  emailAddress?: string | null,
  userType?: UserType,
) => {
  currentUserId = userId;
  if (!isAnalyticsEnabled()) return;
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;

  const classified =
    userType ?? (emailAddress ? classifyUserType(emailAddress) : undefined);
  const userTypeValue = classified
    ? toAnalyticsUserType(classified)
    : undefined;

  void ensureCollectionEnabled().then(() => {
    analytics().setUserId(userId);
    if (userTypeValue) {
      analytics().setUserProperty("user_type", userTypeValue);
    }
  });
};

export const trackScreenView = (args: {
  screenName: string;
  persona: Persona;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.ScreenView, {
    screen_name: args.screenName,
    ...withIdentity({ persona: args.persona, emailAddress: args.emailAddress }),
  });

export const trackViewItemList = (args: {
  itemListName: string;
  persona: Persona;
  city?: string;
  discoverCategory?: string;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.ViewItemList, {
    item_list_name: args.itemListName,
    ...withIdentity({
      persona: args.persona,
      city: args.city,
      discoverCategory: args.discoverCategory,
      emailAddress: args.emailAddress,
      funnelStep: "discover",
    }),
  });

export const trackSearch = (args: {
  searchTerm: string;
  persona: Persona;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.Search, {
    search_term: args.searchTerm,
    ...withIdentity({
      persona: args.persona,
      emailAddress: args.emailAddress,
      funnelStep: "search",
    }),
  });

export const trackViewItem = (args: {
  item: AnalyticsItem;
  persona: Persona;
  contentType: ContentType;
  merchantId?: string;
  merchantSlug?: string;
  value?: number;
  currency?: string;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.ViewItem, {
    currency: args.currency ?? "ZAR",
    value: args.value ?? args.item.price,
    item_id: args.item.item_id,
    item_name: args.item.item_name,
    ...withIdentity({
      persona: args.persona,
      contentType: args.contentType,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      emailAddress: args.emailAddress,
      funnelStep: "view_item",
    }),
  });

export const trackAddToCart = (args: {
  items: AnalyticsItem[];
  value: number;
  persona: Persona;
  currency?: string;
  merchantId?: string;
  merchantSlug?: string;
  contentType?: ContentType;
  orderKind?: OrderKind;
  emailAddress?: string | null;
}) => {
  const first = args.items[0];
  return sendGa4Event(Ga4Events.AddToCart, {
    currency: args.currency ?? "ZAR",
    value: args.value,
    item_id: first?.item_id,
    item_name: first?.item_name,
    quantity: first?.quantity ?? 1,
    ...withIdentity({
      persona: args.persona,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      contentType: args.contentType,
      orderKind: args.orderKind,
      emailAddress: args.emailAddress,
      funnelStep: "cart",
    }),
  });
};

export const trackBeginCheckout = (args: {
  value: number;
  persona: Persona;
  currency?: string;
  orderKind?: OrderKind;
  merchantId?: string;
  merchantSlug?: string;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.BeginCheckout, {
    currency: args.currency ?? "ZAR",
    value: args.value,
    ...withIdentity({
      persona: args.persona,
      orderKind: args.orderKind,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      emailAddress: args.emailAddress,
      funnelStep: "checkout",
    }),
  });

export const trackAddPaymentInfo = (args: {
  persona: Persona;
  paymentType?: string;
  value?: number;
  orderKind?: OrderKind;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.AddPaymentInfo, {
    payment_type: args.paymentType ?? "card",
    value: args.value,
    currency: "ZAR",
    ...withIdentity({
      persona: args.persona,
      orderKind: args.orderKind,
      emailAddress: args.emailAddress,
      funnelStep: "payment",
    }),
  });

export const trackPurchase = (args: {
  transactionId: string;
  value: number;
  persona: Persona;
  currency?: string;
  orderKind?: OrderKind;
  merchantId?: string;
  merchantSlug?: string;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.Purchase, {
    transaction_id: args.transactionId,
    currency: args.currency ?? "ZAR",
    value: args.value,
    ...withIdentity({
      persona: args.persona,
      orderKind: args.orderKind,
      merchantId: args.merchantId,
      merchantSlug: args.merchantSlug,
      emailAddress: args.emailAddress,
      funnelStep: "purchase",
    }),
  });

export const trackLogin = (args: {
  method?: string;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.Login, {
    sign_in_method: args.method ?? "unknown",
    ...withIdentity({
      persona: "consumer",
      emailAddress: args.emailAddress,
    }),
  });

export const trackSignUp = (args: {
  method?: string;
  emailAddress?: string | null;
}) =>
  sendGa4Event(Ga4Events.SignUp, {
    sign_up_method: args.method ?? "unknown",
    ...withIdentity({
      persona: "consumer",
      emailAddress: args.emailAddress,
    }),
  });

/** @internal test hook */
export const __getCurrentUserIdForTests = () => currentUserId;
