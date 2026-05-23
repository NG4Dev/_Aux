# Mobile Auth Flow Audit

Last updated: 2026-05-23

This matrix tracks every authentication entry point, whether Convex user sync runs, whether date of birth (DOB) is collected, server onboarding gates apply, and the expected exit route.

## Source of truth

| State | When signed in | When guest |
|-------|----------------|------------|
| Account onboarding complete | `users.onboardingCompletedAt` on Convex | N/A |
| Guest browse unlocked | N/A | Local `guest_browse_unlocked` (+ in-memory sync cache) |
| Guest showcase seen | Used to skip re-show only | Local `guest_showcase_seen` |
| DOB | `users.dateOfBirth` on Convex | Not collected |
| Post-auth routing | `post-auth` → `resolveAuthSession` → `ensureCurrentWithStatus` (with token wait + retry) | N/A |

**Rule:** Local guest flags never satisfy account onboarding. When `isSignedIn`, only Convex profile fields gate DOB, preferences, and notifications.

## OAuth deep link

- Redirect URI: `aux://oauth-native-callback`
- Route: [`app/oauth-native-callback.tsx`](../src/app/oauth-native-callback.tsx) — calls `WebBrowser.maybeCompleteAuthSession()`, forwards signed-in users to `/(auth)/post-auth`.
- All SSO buttons use [`completeSsoFlow`](../src/services/completeSsoFlow.ts) → `post-auth` (never inline `ensureCurrentWithStatus`).

## Entry point matrix

| Entry point | File | ensureCurrent / status | DOB collected | Server gate | Expected exit route |
|-------------|------|------------------------|---------------|-------------|---------------------|
| Email sign-up | `(auth)/sign-up.tsx` | After verify → `success.tsx` → `post-auth` | Sign-up step 3 (shared picker) | Yes | Per `resolveAuthSession` |
| Email sign-in (password) | `(auth)/sign-in.tsx` | `post-auth` | Mandatory screen if missing | Yes | Per `resolveAuthSession` |
| Google OAuth (sign-in screen) | `SignInWith.tsx` | `post-auth` | Mandatory screen if new/missing | Yes | Per `resolveAuthSession` + "Signing you up…" toast if new |
| OAuth (selection) | `(auth)/selection.tsx` | `post-auth` | Mandatory screen if new/missing | Yes | Per `resolveAuthSession` |
| OAuth (guest sheet) | `GuestAuthSheet.tsx` | `post-auth` | Mandatory screen if new/missing | Yes | Per `resolveAuthSession` |
| Magic link | `(auth)/sign-in.tsx` → `post-auth` | Partial — post-auth calls resolver (NG-51) | If session completes | Yes | Per `resolveAuthSession` |
| Guest continue | `(auth)/index.tsx` | No | No | Local browse only | `/(onboarding)/showcase` → tabs (no prefs/notifications) |
| Guest → create account | Any auth path | `post-auth` → `ensureCurrentWithStatus` | Yes | Yes | DOB → preferences → notifications (showcase skipped if seen) |
| Checkout | `checkout/payment.tsx` | `ensureCurrent` | Root layout redirects to DOB if missing | Yes | `date-of-birth` before tabs |

## Guest vs signed-in onboarding

| Step | Guest | Signed-in (new account) |
|------|-------|-------------------------|
| Showcase | Yes → then tabs | Yes unless `guest_showcase_seen` |
| DOB | No | **Required** |
| Preferences | **No** | **Required** (Convex) |
| Notifications | **No** | **Required** (Convex) |

## Routing authority

- **Root** [`app/_layout.tsx`](../src/app/_layout.tsx): sole guard for signed-in users (DOB → showcase or preferences → home). Uses sync guest cache to avoid redirect races.
- **Auth group** [`(auth)/_layout.tsx`](../src/app/(auth)/_layout.tsx): must NOT redirect signed-in users to tabs.
- **post-auth** [`(auth)/post-auth.tsx`](../src/app/(auth)/post-auth.tsx): waits for Clerk token, retries Convex sync, routes to onboarding step.
- **Showcase** [`(onboarding)/showcase.tsx`](../src/app/(onboarding)/showcase.tsx): guests → tabs; signed-in → preferences.
- **Preferences / notifications / DOB**: redirect guests away on mount; show loading spinner during redirect.

## Server gates (Convex)

- `users.ensureCurrentWithStatus` — returns `{ isNewUser, hasDateOfBirth, onboardingComplete }`.
- `userProfile.completeOnboardingStep({ markComplete: true })` — **throws** if `dateOfBirth` is missing.
- `userProfile.updateProfile({ dateOfBirth })` — validates ISO `YYYY-MM-DD`, records `dob` onboarding step.

## Known gaps / follow-ups

| ID | Item |
|----|------|
| NG-51 | Magic link: Clerk email-link session completion not fully implemented |
| NG-54 | QA: guest must not see preferences/notifications; guest→account full onboarding |
| Future | Minimum age threshold (18/21) by region — deferred |
| NG-37–NG-41 | QA tickets depend on NG-53 unified routing |
| Clerk Dashboard | Confirm `aux://oauth-native-callback` in OAuth redirect allowlist |

## Manual QA checklist

- [ ] Guest: Continue as guest → showcase → Get Started → tabs; never preferences or notifications
- [ ] Guest deep-link to `/preferences` or `/notifications` → redirected away
- [ ] Guest → account: guest browse unlocked → sign up → DOB → preferences → notifications (showcase skipped)
- [ ] Fresh account (no prior guest): DOB → showcase → preferences → notifications → home
- [ ] OAuth Google (new user, sign-in mode): no 404, lands on DOB after brief loading
- [ ] OAuth Google (existing onboarded user): lands on home
- [ ] Returning user (DOB + onboarding complete): straight to home
- [ ] Existing user missing DOB in DB: forced to DOB before tabs
- [ ] Notifications without DOB while signed in: error from server, no blank screen
- [ ] Convex after account onboarding: `dateOfBirth`, `interestCategoryIds`, `notificationSettings`, `onboardingCompletedAt` set
