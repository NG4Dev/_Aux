import Constants from "expo-constants";

type AnalyticsExtra = {
  analyticsEnabled?: boolean;
  analyticsAllowDev?: boolean;
};

function extraFlags(): AnalyticsExtra {
  const extra = Constants.expoConfig?.extra as AnalyticsExtra | undefined;
  return extra ?? {};
}

/**
 * Production / release builds: EXPO_PUBLIC_ANALYTICS_ENABLED=true and !__DEV__.
 * Temporary pre-prod: also set EXPO_PUBLIC_ANALYTICS_ALLOW_DEV=true for Metro;
 * unset ALLOW_DEV before true prod cutover.
 *
 * Also reads `extra.analyticsEnabled` / `extra.analyticsAllowDev` from
 * app.config.js (baked on EAS) so preview APKs don't silently no-op when
 * Metro fails to inline EXPO_PUBLIC_* under EAS Environments.
 */
export const isAnalyticsEnabled = (): boolean => {
  const extra = extraFlags();
  const enabled =
    process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true" ||
    extra.analyticsEnabled === true;
  if (!enabled) return false;
  if (!__DEV__) return true;
  return (
    process.env.EXPO_PUBLIC_ANALYTICS_ALLOW_DEV === "true" ||
    extra.analyticsAllowDev === true
  );
};
