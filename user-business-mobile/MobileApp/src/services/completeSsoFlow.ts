import * as AuthSession from 'expo-auth-session';
import { authLog } from '@/services/authFlowLogger';

type AuthRouter = {
  replace: (href: string) => void;
};

export type SsoStrategy = 'oauth_google' | 'oauth_facebook' | 'oauth_apple';

type StartSSOFlowResult = {
  createdSessionId: string | null;
  setActive?: (params: { session: string }) => Promise<void>;
  signIn?: {
    status: string;
    createdSessionId: string | null;
  };
};

type StartSSOFlow = (params: {
  strategy: SsoStrategy;
  redirectUrl: string;
}) => Promise<StartSSOFlowResult>;

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

  const { createdSessionId, setActive, signIn } = await startSSOFlow({
    strategy,
    redirectUrl,
  });

  authLog('ssoFlow', 'startSSOFlowResult', {
    hasCreatedSessionId: !!createdSessionId,
    signInStatus: signIn?.status ?? null,
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
