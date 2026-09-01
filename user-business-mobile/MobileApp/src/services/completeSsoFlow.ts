import * as AuthSession from 'expo-auth-session';
import { authLog } from '@/services/authFlowLogger';

type AuthRouter = {
  replace: (href: string) => void;
};

export type SsoStrategy = 'oauth_google' | 'oauth_facebook' | 'oauth_apple';

/** Minimal shape read from Clerk startSSOFlow — intentionally loose for @clerk/expo compat. */
export type StartSSOFlow = (params: {
  strategy: SsoStrategy;
  redirectUrl: string;
}) => Promise<{
  createdSessionId: string | null;
  setActive?: (params: { session: string }) => Promise<void>;
  signIn?: {
    status?: string | null;
    createdSessionId?: string | null;
  } | null;
}>;

export function getOAuthRedirectUrl(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'aux',
    path: 'oauth-native-callback',
  });
}

export async function completeSsoFlow(
  startSSOFlow: StartSSOFlow,
  strategy: SsoStrategy,
): Promise<{ ok: true } | { ok: false; reason: 'incomplete' | 'cancelled' }> {
  const redirectUrl = getOAuthRedirectUrl();
  authLog('ssoFlow', 'start', { strategy, redirectUrl });

  let createdSessionId: string | null;
  let setActive: ((params: { session: string }) => Promise<void>) | undefined;
  let signIn:
    | {
        status?: string | null;
        createdSessionId?: string | null;
      }
    | null
    | undefined;
  let signUpStatus: string | null = null;

  try {
    const result = await startSSOFlow({
      strategy,
      redirectUrl,
    });
    createdSessionId = result.createdSessionId;
    setActive = result.setActive;
    signIn = result.signIn;
    signUpStatus =
      (result as { signUp?: { status?: string | null } }).signUp?.status ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    authLog('ssoFlow', 'startSSOFlowError', { message });
    if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('dismiss')) {
      return { ok: false, reason: 'cancelled' };
    }
    throw err;
  }

  authLog('ssoFlow', 'startSSOFlowResult', {
    hasCreatedSessionId: !!createdSessionId,
    signInStatus: signIn?.status ?? null,
    signUpStatus,
    hasSetActive: !!setActive,
  });

  if (createdSessionId && setActive) {
    await setActive({ session: createdSessionId });
    authLog('ssoFlow', 'setActiveSuccess', { via: 'createdSessionId' });
    return { ok: true };
  }

  if (signIn?.status === 'complete' && signIn.createdSessionId && setActive) {
    await setActive({ session: signIn.createdSessionId });
    authLog('ssoFlow', 'setActiveSuccess', { via: 'signInComplete' });
    return { ok: true };
  }

  authLog('ssoFlow', 'incomplete', {
    signInStatus: signIn?.status ?? null,
  });
  return { ok: false, reason: 'incomplete' };
}

export function navigateToPostAuth(router: AuthRouter): void {
  authLog('ssoFlow', 'navigatePostAuth', { to: '/(auth)/post-auth' });
  router.replace('/(auth)/post-auth');
}
