export const isAnalyticsEnabled = (): boolean =>
  !__DEV__ && process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true";
