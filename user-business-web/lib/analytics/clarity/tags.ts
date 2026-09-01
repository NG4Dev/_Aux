"use client";

import { isAnalyticsEnabled } from "@/lib/analytics/analyticsEnabled";
import {
  classifyUserType,
  toAnalyticsUserType,
  type UserType,
} from "@/lib/analytics/userClassification";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export const isClarityEnabled = () =>
  isAnalyticsEnabled() &&
  !!process.env.NEXT_PUBLIC_CLARITY_ID &&
  typeof window !== "undefined";

export const setClarityUserContext = (args: {
  userId?: string;
  emailAddress?: string | null;
  userType?: UserType;
  persona?: string;
  merchantSlug?: string;
  funnelStep?: string;
  experimentId?: string;
  variant?: string;
  city?: string;
}) => {
  if (!isClarityEnabled() || typeof window.clarity !== "function") {
    return;
  }

  const userType = toAnalyticsUserType(
    args.userType ?? classifyUserType(args.emailAddress),
  );

  try {
    if (args.userId) {
      window.clarity("identify", args.userId);
    }
    window.clarity("set", "user_type", userType);
    if (args.persona) window.clarity("set", "persona", args.persona);
    if (args.merchantSlug) {
      window.clarity("set", "merchant_slug", args.merchantSlug);
    }
    if (args.funnelStep) {
      window.clarity("set", "funnel_step", args.funnelStep);
    }
    if (args.experimentId) {
      window.clarity("set", "experiment_id", args.experimentId);
    }
    if (args.variant) window.clarity("set", "variant", args.variant);
    if (args.city) window.clarity("set", "city", args.city);
  } catch {
    // Clarity may not be ready
  }
};
