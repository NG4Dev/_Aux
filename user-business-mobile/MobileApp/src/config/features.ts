import type { ModelChoice } from '@/services/aiChat';

export const USE_CONVEX_DATA =
  process.env.EXPO_PUBLIC_USE_CONVEX_DATA !== 'false';

/** When true, never fall back to mockFeed/mockBusinesses fiction. */
export const STRICT_LIVE_DATA =
  process.env.EXPO_PUBLIC_STRICT_LIVE_DATA === 'true' || USE_CONVEX_DATA;

/** Submission / preview APK: set EXPO_PUBLIC_DEFAULT_ASSISTANT_MODEL=gemma-fireworks in eas.json */
export function getDefaultAssistantModel(): ModelChoice {
  const raw = process.env.EXPO_PUBLIC_DEFAULT_ASSISTANT_MODEL;
  if (raw === 'gemma-fireworks' || raw === 'qwen-amd') {
    return raw;
  }
  return 'qwen-amd';
}
