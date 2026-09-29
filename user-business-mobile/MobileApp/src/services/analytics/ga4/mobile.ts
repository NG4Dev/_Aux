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

/** RN Firebase v22+ modular surface (no namespaced `.default()` export). */
type AnalyticsInstance = object;

type FirebaseAnalyticsMod = {
  getAnalytics: () => AnalyticsInstance;
  logEvent: (
    analytics: AnalyticsInstance,
    name: string,
    params?: Record<string, string | number>,
  ) => void | Promise<void>;
  logScreenView: (
    analytics: AnalyticsInstance,
    params: { screen_name: string; screen_class?: string },
  ) => void | Promise<void>;
  setUserId: (
    analytics: AnalyticsInstance,
    id: string | null,
  ) => void | Promise<void>;
  setUserProperty: (
    analytics: AnalyticsInstance,
    name: string,
    value: string | null,
  ) => void | Promise<void>;
  setAnalyticsCollectionEnabled: (
    analytics: AnalyticsInstance,
    enabled: boolean,
  ) => void | Promise<void>;
};

let collectionConfigured = false;
let currentUserId: string | null = null;

function getFirebaseAnalyticsMod(): FirebaseAnalyticsMod | null {
  if (Platform.OS === "web") return null;
  try {
    // Native module — requires google-services after prebuild.
    // v26 is ESM/modular only: named exports, not `.default()`.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-firebase/analytics") as
      | FirebaseAnalyticsMod
      | { default?: FirebaseAnalyticsMod };
    if (mod && typeof (mod as FirebaseAnalyticsMod).getAnalytics === "function") {
      return mod as FirebaseAnalyticsMod;
    }
    const nested = (mod as { default?: FirebaseAnalyticsMod }).default;
    if (nested && typeof nested.getAnalytics === "function") {
      return nested;
    }
    return null;
  } catch {
    return null;
  }
}

/** Boot/diag: modular analytics JS module resolved (native bridge may still fail). */
export const hasFirebaseAnalyticsModule = (): boolean =>
  getFirebaseAnalyticsMod() !== null;

async function ensureCollectionEnabled(mod: FirebaseAnalyticsMod) {
  if (collectionConfigured || !isAnalyticsEnabled()) return;
  try {
    const analytics = mod.getAnalytics();
    await Promise.resolve(mod.setAnalyticsCollectionEnabled(analytics, true));
    collectionConfigured = true;
  } catch (error) {
    // Collection is usually already on via google-services; don't block events.
    console.warn("Firebase setAnalyticsCollectionEnabled failed", error);
    collectionConfigured = true;
  }
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
  const mod = getFirebaseAnalyticsMod();
  if (!mod) return;

  await ensureCollectionEnabled(mod);
  const analytics = mod.getAnalytics();

  const payload = sanitizeParams({
    ...params,
    platform: Platform.OS,
  });

  try {
    if (name === Ga4Events.ScreenView && payload.screen_name) {
      await Promise.resolve(
        mod.logScreenView(analytics, {
          screen_name: String(payload.screen_name),
          screen_class: String(payload.screen_name),
        }),
      );
      return;
    }
    await Promise.resolve(mod.logEvent(analytics, name, payload));
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
  const mod = getFirebaseAnalyticsMod();
  if (!mod) return;

  const classified =
    userType ?? (emailAddress ? classifyUserType(emailAddress) : undefined);
  const userTypeValue = classified
    ? toAnalyticsUserType(classified)
    : undefined;

  void ensureCollectionEnabled(mod).then(() => {
    const analytics = mod.getAnalytics();
    void Promise.resolve(mod.setUserId(analytics, userId));
    if (userTypeValue) {
      void Promise.resolve(
        mod.setUserProperty(analytics, "user_type", userTypeValue),
      );
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
