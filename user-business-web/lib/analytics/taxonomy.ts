/** GA4 snake_case event names (ecommerce-first). */
export const Ga4Events = {
  PageView: "page_view",
  Login: "login",
  SignUp: "sign_up",
  Search: "search",
  ViewItemList: "view_item_list",
  SelectItem: "select_item",
  ViewItem: "view_item",
  AddToCart: "add_to_cart",
  BeginCheckout: "begin_checkout",
  AddPaymentInfo: "add_payment_info",
  Purchase: "purchase",
  Ga4UserSet: "ga4_user_set",
  Ga4UserClear: "ga4_user_clear",
  OnboardingStepCompleted: "onboarding_step_completed",
  MerchantProfileCompleted: "merchant_profile_completed",
  MerchantListingCreated: "merchant_listing_created",
  MerchantPromoPublished: "merchant_promo_published",
  MerchantFirstOrder: "merchant_first_order",
  MerchantOrderReceived: "merchant_order_received",
} as const;

export type Ga4EventName = (typeof Ga4Events)[keyof typeof Ga4Events];

/** Mixpanel Title Case funnel steps. */
export const MixpanelEvents = {
  AppOpened: "App Opened",
  DiscoverHomeViewed: "Discover Home Viewed",
  CategoryFeedViewed: "Category Feed Viewed",
  SearchPerformed: "Search Performed",
  ProductViewed: "Product Viewed",
  EventViewed: "Event Viewed",
  AddToCart: "Add To Cart",
  CheckoutStarted: "Checkout Started",
  PaymentStarted: "Payment Started",
  OrderPaid: "Order Paid",
  TicketPurchased: "Ticket Purchased",
  SignUp: "Signed Up",
  Login: "Logged In",
  MerchantSignedUp: "Merchant Signed Up",
  MerchantProfileCompleted: "Merchant Profile Completed",
  ProductListed: "Product Listed",
  EventListed: "Event Listed",
  PromoPublished: "Promo Published",
  FirstOrderReceived: "First Order Received",
  OrderReceived: "Order Received",
  OnboardingStepCompleted: "Onboarding Step Completed",
} as const;

export type MixpanelEventName =
  (typeof MixpanelEvents)[keyof typeof MixpanelEvents];

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price?: number;
  quantity?: number;
};

export type ContentType = "product" | "event" | "place";
export type OrderKind = "product" | "ticket" | "bundle" | "resale";
