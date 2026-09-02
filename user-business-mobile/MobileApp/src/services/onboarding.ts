import * as SecureStore from 'expo-secure-store';
import { authLog } from '@/services/authFlowLogger';

/** @deprecated Legacy key — migrated to guest-specific keys below. */
const LEGACY_ONBOARDING_COMPLETED_KEY = 'onboarding_apple_invites_completed';

/** Guest may browse tabs without an account after finishing showcase. */
const GUEST_BROWSE_UNLOCKED_KEY = 'guest_browse_unlocked';

/** Guest already viewed the marketing showcase (skip re-show on account creation). */
const GUEST_SHOWCASE_SEEN_KEY = 'guest_showcase_seen';

let legacyMigrationDone = false;
let guestBrowseUnlockedCache: boolean | null = null;

async function migrateLegacyGuestFlags(): Promise<void> {
  if (legacyMigrationDone) return;
  legacyMigrationDone = true;

  const legacy = await SecureStore.getItemAsync(LEGACY_ONBOARDING_COMPLETED_KEY);
  if (legacy !== 'true') return;

  const browse = await SecureStore.getItemAsync(GUEST_BROWSE_UNLOCKED_KEY);
  const seen = await SecureStore.getItemAsync(GUEST_SHOWCASE_SEEN_KEY);

  if (browse !== 'true') {
    await SecureStore.setItemAsync(GUEST_BROWSE_UNLOCKED_KEY, 'true');
  }
  if (seen !== 'true') {
    await SecureStore.setItemAsync(GUEST_SHOWCASE_SEEN_KEY, 'true');
  }
}

/** Synchronous read of in-memory cache (null = not yet hydrated from SecureStore). */
export function getGuestBrowseUnlockedSync(): boolean | null {
  return guestBrowseUnlockedCache;
}

export async function isGuestBrowseUnlocked(): Promise<boolean> {
  if (guestBrowseUnlockedCache === true) {
    authLog('onboarding', 'guestBrowseUnlockedRead', { source: 'syncCache', unlocked: true });
    return true;
  }

  await migrateLegacyGuestFlags();
  const result = await SecureStore.getItemAsync(GUEST_BROWSE_UNLOCKED_KEY);
  const unlocked = result === 'true';
  guestBrowseUnlockedCache = unlocked;
  authLog('onboarding', 'guestBrowseUnlockedRead', { source: 'secureStore', unlocked });
  return unlocked;
}

export async function markGuestBrowseUnlocked(): Promise<void> {
  guestBrowseUnlockedCache = true;
  authLog('onboarding', 'markGuestBrowseUnlocked', { syncCache: true });
  await SecureStore.setItemAsync(GUEST_BROWSE_UNLOCKED_KEY, 'true');
}

export async function hasGuestShowcaseSeen(): Promise<boolean> {
  await migrateLegacyGuestFlags();
  const result = await SecureStore.getItemAsync(GUEST_SHOWCASE_SEEN_KEY);
  return result === 'true';
}

export async function markGuestShowcaseSeen(): Promise<void> {
  await SecureStore.setItemAsync(GUEST_SHOWCASE_SEEN_KEY, 'true');
}

/** Guest-only: unlock browse after showcase. Not account onboarding complete. */
export async function completeGuestOnboarding(): Promise<void> {
  guestBrowseUnlockedCache = true;
  authLog('onboarding', 'completeGuestOnboarding', { syncCache: true });
  await markGuestBrowseUnlocked();
  await markGuestShowcaseSeen();
  authLog('onboarding', 'completeGuestOnboardingDone', {
    syncCache: getGuestBrowseUnlockedSync(),
  });
}

/** @deprecated Use isGuestBrowseUnlocked — guest browse only, not account onboarding. */
export const isOnboardingCompletedLocal = isGuestBrowseUnlocked;

/** @deprecated Use markGuestBrowseUnlocked or completeGuestOnboarding. */
export const markOnboardingCompleteLocal = markGuestBrowseUnlocked;

/** @deprecated Use isGuestBrowseUnlocked */
export const isOnboardingCompleted = isGuestBrowseUnlocked;

/** @deprecated Use markGuestBrowseUnlocked */
export const markOnboardingComplete = markGuestBrowseUnlocked;

export function isOnboardingCompleteFromProfile(
  onboardingCompletedAt: number | undefined,
): boolean {
  return onboardingCompletedAt !== undefined;
}
