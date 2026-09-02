"use client";

import { isAnalyticsEnabled } from "@/lib/analytics/analyticsEnabled";
import {
  classifyUserType,
  toAnalyticsUserType,
  type UserType,
} from "@/lib/analytics/userClassification";
import type { MixpanelEventName } from "@/lib/analytics/taxonomy";

type Props = Record<string, string | number | boolean | undefined | null>;

let initialized = false;

const token = () => process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const isMixpanelEnabled = () =>
  isAnalyticsEnabled() &&
  !!token() &&
  typeof window !== "undefined";

async function getMixpanel() {
  if (!isMixpanelEnabled()) return null;
  const mod = await import("mixpanel-browser");
  const mixpanel = mod.default;
  if (!initialized) {
    mixpanel.init(token()!, {
      track_pageview: false,
      persistence: "localStorage",
    });
    initialized = true;
  }
  return mixpanel;
}

export const identifyMixpanelUser = async (args: {
  userId: string;
  emailAddress?: string | null;
  userType?: UserType;
  city?: string;
  personaDefault?: string;
}) => {
  const mp = await getMixpanel();
  if (!mp) return;
  const userType = toAnalyticsUserType(
    args.userType ?? classifyUserType(args.emailAddress),
  );
  mp.identify(args.userId);
  mp.people.set({
    user_type: userType,
    ...(args.city ? { city: args.city } : {}),
    ...(args.personaDefault
      ? { persona_default: args.personaDefault }
      : {}),
  });
};

export const resetMixpanel = async () => {
  const mp = await getMixpanel();
  if (!mp) return;
  mp.reset();
};

export const trackMixpanel = async (
  event: MixpanelEventName | string,
  props: Props = {},
) => {
  const mp = await getMixpanel();
  if (!mp) return;
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined && v !== null) cleaned[k] = v;
  }
  mp.track(event, cleaned);
};
