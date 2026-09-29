/**
 * Client + server-safe flag for first-party product analytics.
 * Production requires NEXT_PUBLIC_ANALYTICS_ENABLED=true.
 * Temporary pre-prod: also set NEXT_PUBLIC_ANALYTICS_ALLOW_DEV=true for local/dev;
 * unset ALLOW_DEV before true prod cutover.
 */
export const isAnalyticsEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_ANALYTICS_ALLOW_DEV === "true";
};
