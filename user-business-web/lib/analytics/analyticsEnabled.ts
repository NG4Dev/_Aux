/**
 * Client + server-safe flag for first-party product analytics.
 * Preview deploys often use NODE_ENV=production — require explicit enable.
 */
export const isAnalyticsEnabled = (): boolean =>
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
