import Constants from "expo-constants";
import { isAnalyticsEnabled } from "@/services/analytics/analyticsEnabled";
import {
  classifyUserType,
  toAnalyticsUserType,
  type UserType,
} from "@/services/analytics/userClassification";

type Props = Record<string, string | number | boolean | undefined | null>;

const token = () => {
  const fromEnv = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as
    | { mixpanelToken?: string }
    | undefined;
  return extra?.mixpanelToken || undefined;
};

export const isMixpanelEnabled = () =>
  isAnalyticsEnabled() && !!token();

export async function trackMixpanel(
  event: string,
  props: Props = {},
  distinctId?: string,
) {
  if (!isMixpanelEnabled()) return;
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined && v !== null) cleaned[k] = v;
  }
  try {
    await fetch("https://api.mixpanel.com/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          event,
          properties: {
            token: token(),
            distinct_id: distinctId ?? "anonymous",
            ...cleaned,
          },
        },
      ]),
    });
  } catch {
    // best-effort
  }
}

export async function identifyMixpanelUser(args: {
  userId: string;
  emailAddress?: string | null;
  userType?: UserType;
  city?: string;
  personaDefault?: string;
}) {
  if (!isMixpanelEnabled()) return;
  const userType = toAnalyticsUserType(
    args.userType ?? classifyUserType(args.emailAddress),
  );
  try {
    await fetch("https://api.mixpanel.com/engage#profile-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          $token: token(),
          $distinct_id: args.userId,
          $set: {
            user_type: userType,
            ...(args.city ? { city: args.city } : {}),
            ...(args.personaDefault
              ? { persona_default: args.personaDefault }
              : {}),
          },
        },
      ]),
    });
  } catch {
    // best-effort
  }
}
