const EXPLICIT_AUTH_SCREENS = new Set([
  'selection',
  'sign-in',
  'sign-up',
  'verify',
  'post-auth',
  'reset-password',
]);

/** User intentionally opened sign-in / sign-up / verify / post-auth. */
export function isExplicitAuthRoute(segments: string[]): boolean {
  if (segments[0] === 'oauth-native-callback') return true;
  const screen = segments[0] === '(auth)' ? segments[1] : segments[0];
  return typeof screen === 'string' && EXPLICIT_AUTH_SCREENS.has(screen);
}

/** Passive landing on auth welcome — redirect unlocked guests to tabs. */
export function isPassiveAuthEntry(segments: string[]): boolean {
  if (segments[0] !== '(auth)') return false;
  const screen = segments[1];
  return !screen || screen === 'index';
}

/** Clerk session may still be propagating after OAuth. */
export function isPostAuthSessionPending(
  segments: string[],
  isLoaded: boolean,
  isSignedIn: boolean,
): boolean {
  if (!isLoaded || isSignedIn) return false;
  const screen = segments[0] === '(auth)' ? segments[1] : segments[0];
  return screen === 'post-auth';
}
