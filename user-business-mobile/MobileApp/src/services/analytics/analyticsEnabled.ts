/**
 * Production / release builds: EXPO_PUBLIC_ANALYTICS_ENABLED=true and !__DEV__.
 * Temporary pre-prod: also set EXPO_PUBLIC_ANALYTICS_ALLOW_DEV=true for Metro;
 * unset ALLOW_DEV before true prod cutover.
 */
export const isAnalyticsEnabled = (): boolean => {
  if (process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== "true") return false;
  if (!__DEV__) return true;
  return process.env.EXPO_PUBLIC_ANALYTICS_ALLOW_DEV === "true";
};
