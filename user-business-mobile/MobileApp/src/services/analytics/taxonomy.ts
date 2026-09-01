export const Ga4Events = {
  ScreenView: "screen_view",
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
  OnboardingStepCompleted: "onboarding_step_completed",
} as const;

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
  OnboardingStepCompleted: "Onboarding Step Completed",
} as const;

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
