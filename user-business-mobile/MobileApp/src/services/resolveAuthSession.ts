import type { Id } from '@/convex/_generated/dataModel';
import { authLog } from '@/services/authFlowLogger';
import { hasGuestShowcaseSeen } from '@/services/onboarding';

type AuthRouter = {
  replace: (href: string) => void;
  push: (href: string) => void;
};

export type AuthSessionStatus = {
  userId: Id<'users'>;
  isNewUser: boolean;
  hasDateOfBirth: boolean;
  onboardingComplete: boolean;
};

const SHOWCASE_PATH = '/(onboarding)/showcase';

/** Must match Convex auth.config.ts applicationID and Clerk JWT template name. */
export const CONVEX_JWT_TEMPLATE = 'convex';

export type GetConvexToken = () => Promise<string | null>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNotSignedInError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Not signed in');
}

export async function waitForClerkToken(
  getToken: GetConvexToken,
  maxAttempts = 10,
  delayMs = 200,
): Promise<void> {
  authLog('resolveAuth', 'tokenWaitStart', { maxAttempts, delayMs });
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = await getToken();
    if (token) {
      authLog('resolveAuth', 'tokenReady', { attempts: attempt + 1 });
      return;
    }
    authLog('resolveAuth', 'tokenWaitRetry', { attempt: attempt + 1 });
    await sleep(delayMs);
  }
  authLog('resolveAuth', 'tokenWaitFailed', { maxAttempts });
  throw new Error('Clerk auth token not ready');
}

async function ensureCurrentWithRetry(
  ensureCurrentWithStatus: () => Promise<AuthSessionStatus>,
  maxAttempts = 6,
): Promise<AuthSessionStatus> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await ensureCurrentWithStatus();
      authLog('resolveAuth', 'ensureCurrentSuccess', {
        attempt: attempt + 1,
        isNewUser: status.isNewUser,
        hasDateOfBirth: status.hasDateOfBirth,
        onboardingComplete: status.onboardingComplete,
      });
      return status;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      authLog('resolveAuth', 'ensureCurrentRetry', {
        attempt: attempt + 1,
        message,
      });
      if (isNotSignedInError(err) && attempt < maxAttempts - 1) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Auth sync timed out');
}

export function getAuthDestination(
  status: AuthSessionStatus,
  guestShowcaseSeen = false,
): string {
  if (!status.hasDateOfBirth) {
    return '/(onboarding)/date-of-birth';
  }
  if (!status.onboardingComplete) {
    return guestShowcaseSeen ? '/(onboarding)/preferences' : SHOWCASE_PATH;
  }
  return '/(tabs)/home';
}

export async function resolveAuthSession(
  ensureCurrentWithStatus: () => Promise<AuthSessionStatus>,
  router: AuthRouter,
  options?: {
    onNewUser?: () => void;
    replace?: boolean;
    waitForConvexAuth?: () => Promise<void>;
  },
): Promise<AuthSessionStatus> {
  authLog('resolveAuth', 'start', {});

  if (options?.waitForConvexAuth) {
    await options.waitForConvexAuth();
  }

  const status = await ensureCurrentWithRetry(ensureCurrentWithStatus);
  if (status.isNewUser) {
    authLog('resolveAuth', 'newUser', { userId: status.userId });
    options?.onNewUser?.();
  }

  const guestShowcaseSeen = await hasGuestShowcaseSeen();
  const destination = getAuthDestination(status, guestShowcaseSeen);
  authLog('resolveAuth', 'navigate', {
    destination,
    guestShowcaseSeen,
    isNewUser: status.isNewUser,
    hasDateOfBirth: status.hasDateOfBirth,
    onboardingComplete: status.onboardingComplete,
    replace: options?.replace !== false,
  });

  if (options?.replace === false) {
    router.push(destination as never);
  } else {
    router.replace(destination as never);
  }

  return status;
}

export function profileNeedsDateOfBirth(
  dateOfBirth: string | undefined,
): boolean {
  return dateOfBirth === undefined || dateOfBirth.length === 0;
}

export function profileOnboardingComplete(
  onboardingCompletedAt: number | undefined,
): boolean {
  return onboardingCompletedAt !== undefined;
}

export async function getSignedInIncompleteOnboardingRoute(): Promise<string> {
  const guestShowcaseSeen = await hasGuestShowcaseSeen();
  const route = guestShowcaseSeen ? '/(onboarding)/preferences' : SHOWCASE_PATH;
  authLog('resolveAuth', 'incompleteOnboardingRoute', { route, guestShowcaseSeen });
  return route;
}
