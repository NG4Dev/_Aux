import { useEffect, useRef } from "react";
import { usePathname, useSegments } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import {
  hasFirebaseAnalyticsModule,
  setGa4UserId,
  trackScreenView,
} from "@/services/analytics/ga4/mobile";
import {
  identifyMixpanelUser,
  isAnalyticsEnabled,
  trackMixpanel,
  MixpanelEvents,
} from "@/services/analytics";
import type { Persona } from "@/services/analytics/userClassification";

function resolvePersona(segments: string[]): Persona {
  if (segments.includes("admin")) return "merchant";
  return "consumer";
}

export default function MobileAnalyticsObserver() {
  const pathname = usePathname();
  const segments = useSegments();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const lastUserRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>("");
  const appOpenedRef = useRef(false);

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!appOpenedRef.current) {
      appOpenedRef.current = true;
      const extra = Constants.expoConfig?.extra as
        | {
            firebaseNativeEnabled?: boolean;
            analyticsEnabled?: boolean;
            mixpanelToken?: string;
          }
        | undefined;
      console.warn("[AnalyticsBoot]", {
        enabled: isAnalyticsEnabled(),
        __DEV__,
        envEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED,
        envAllowDev: process.env.EXPO_PUBLIC_ANALYTICS_ALLOW_DEV,
        extraAnalyticsEnabled: extra?.analyticsEnabled === true,
        firebaseNativeEnabled: extra?.firebaseNativeEnabled === true,
        hasFirebaseAnalyticsModule: hasFirebaseAnalyticsModule(),
        hasMixpanelToken: Boolean(
          process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || extra?.mixpanelToken,
        ),
      });
      void trackMixpanel(MixpanelEvents.AppOpened, {
        persona: "consumer",
        platform: "mobile",
      });
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && userId) {
      if (lastUserRef.current !== userId) {
        setGa4UserId(userId, email);
        void identifyMixpanelUser({
          userId,
          emailAddress: email,
          personaDefault: resolvePersona(segments as string[]),
        });
        lastUserRef.current = userId;
      }
      return;
    }
    if (lastUserRef.current) {
      setGa4UserId(null);
      lastUserRef.current = null;
    }
  }, [isSignedIn, userId, email, segments]);

  useEffect(() => {
    const path = pathname || "/";
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;
    const persona = resolvePersona(segments as string[]);
    void trackScreenView({
      screenName: path,
      persona,
      emailAddress: email,
    });
  }, [pathname, segments, email]);

  return null;
}
