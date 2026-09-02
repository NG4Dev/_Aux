import { Stack, useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import ConvexClerkProvider from '@/providers/ConvexClerkProvider';
import StripeAppProvider from '@/providers/StripeAppProvider';
import ConvexQueryErrorBoundary from '@/components/ConvexQueryErrorBoundary';
import MobileAnalyticsObserver from '@/components/analytics/MobileAnalyticsObserver';
import { authLog } from '@/services/authFlowLogger';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';
import {
  getGuestBrowseUnlockedSync,
  isGuestBrowseUnlocked,
  markGuestBrowseUnlocked,
} from '@/services/onboarding';
import {
  getSignedInIncompleteOnboardingRoute,
  profileNeedsDateOfBirth,
  profileOnboardingComplete,
} from '@/services/resolveAuthSession';
import { api } from '@/convex/_generated/api';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const SHOWCASE_PATH = '/(onboarding)/showcase';

WebBrowser.maybeCompleteAuthSession();

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

function useSafeReplace(router: ReturnType<typeof useRouter>, scope: string) {
  const lastRedirectRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(
    (path: string, reason: string) => {
      if (lastRedirectRef.current === path) {
        authLog(scope, 'redirectSkipped', { path, reason, duplicate: true });
        return;
      }
      lastRedirectRef.current = path;
      authLog(scope, 'redirect', { path, reason });

      // Defer until after mount — avoids expo-router linking race on cold start.
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        router.replace(path as never);
      });
    },
    [router, scope],
  );
}

function RootStack() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="oauth-native-callback" options={{ headerShown: false }} />
      <Stack.Screen
        name="wallet"
        options={{ presentation: 'modal', headerShown: false, contentStyle: { backgroundColor: '#000' } }}
      />
    </Stack>
  );
}

function GuestOnlyLayout() {
  const segments = useSegments();
  const router = useRouter();
  const safeReplace = useSafeReplace(router, 'layout.guestFallback');
  const [guestBrowseUnlocked, setGuestBrowseUnlocked] = useState<boolean | null>(
    () => getGuestBrowseUnlockedSync(),
  );

  useEffect(() => {
    void isGuestBrowseUnlocked().then(setGuestBrowseUnlocked);
  }, [segments]);

  useEffect(() => {
    const syncUnlocked = getGuestBrowseUnlockedSync();
    const unlocked =
      syncUnlocked === true || guestBrowseUnlocked === true;

    const inAuthGroup =
      segments[0] === '(auth)' ||
      segments[0] === 'selection' ||
      segments[0] === 'sign-in' ||
      segments[0] === 'sign-up' ||
      segments[0] === 'oauth-native-callback';
    const inOnboardingGroup =
      segments[0] === '(onboarding)' ||
      segments[0] === 'showcase' ||
      segments[0] === 'notifications';

    if (!unlocked && guestBrowseUnlocked === null && syncUnlocked === null) {
      authLog('layout.guestFallback', 'guardWait', {
        segments,
        guestBrowseUnlocked,
        syncUnlocked,
      });
      return;
    }

    authLog('layout.guestFallback', 'guardEval', {
      segments,
      guestBrowseUnlocked,
      syncUnlocked,
      unlocked,
      inAuthGroup,
      inOnboardingGroup,
    });

    if (!segments[0]) {
      if (unlocked) {
        safeReplace('/(tabs)/home', 'emptySegmentGuest');
      } else {
        safeReplace('/(auth)', 'emptySegment');
      }
    } else if (!unlocked && !inOnboardingGroup && !inAuthGroup && segments[0] !== '(tabs)') {
      safeReplace(SHOWCASE_PATH, 'guestNotUnlocked');
    } else {
      authLog('layout.guestFallback', 'guardNoAction', {
        segments,
        unlocked,
      });
    }
  }, [guestBrowseUnlocked, segments, safeReplace]);

  return <RootStack />;
}

function ProfileAwareLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const safeReplace = useSafeReplace(router, 'layout.profile');
  const profile = useQuery(api.userProfile.getProfile, isSignedIn ? {} : 'skip');
  const [guestBrowseUnlocked, setGuestBrowseUnlocked] = useState<boolean | null>(
    () => (isSignedIn ? null : getGuestBrowseUnlockedSync()),
  );
  const [signedInOnboardingRoute, setSignedInOnboardingRoute] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isSignedIn) {
      void isGuestBrowseUnlocked().then(setGuestBrowseUnlocked);
    }
  }, [isSignedIn, segments]);

  useEffect(() => {
    if (profile?.onboardingCompletedAt !== undefined) {
      void markGuestBrowseUnlocked();
    }
  }, [profile?.onboardingCompletedAt]);

  useEffect(() => {
    if (isSignedIn) {
      void getSignedInIncompleteOnboardingRoute().then(setSignedInOnboardingRoute);
    }
  }, [isSignedIn, segments, profile?.onboardingCompletedAt]);

  const needsDateOfBirth = isSignedIn
    ? profileNeedsDateOfBirth(profile?.dateOfBirth)
    : false;

  const guestUnlocked =
    getGuestBrowseUnlockedSync() === true || guestBrowseUnlocked === true;

  const onboardingComplete = isSignedIn
    ? profileOnboardingComplete(profile?.onboardingCompletedAt)
    : guestUnlocked;

  useEffect(() => {
    if (!isLoaded) {
      authLog('layout.profile', 'guardWait', { reason: 'clerkNotLoaded' });
      return;
    }
    if (isSignedIn && profile === undefined) {
      authLog('layout.profile', 'guardWait', { reason: 'profileLoading' });
      return;
    }

    const syncGuest = getGuestBrowseUnlockedSync();
    if (
      !isSignedIn &&
      guestBrowseUnlocked === null &&
      syncGuest === null
    ) {
      authLog('layout.profile', 'guardWait', {
        reason: 'guestFlagsHydrating',
        segments,
      });
      return;
    }

    if (isSignedIn && !onboardingComplete && signedInOnboardingRoute === null) {
      authLog('layout.profile', 'guardWait', {
        reason: 'signedInOnboardingRouteLoading',
      });
      return;
    }

    const inAuthGroup =
      segments[0] === '(auth)' ||
      segments[0] === 'selection' ||
      segments[0] === 'sign-in' ||
      segments[0] === 'sign-up' ||
      segments[0] === 'oauth-native-callback';
    const inOnboardingGroup =
      segments[0] === '(onboarding)' ||
      segments[0] === 'showcase' ||
      segments[0] === 'notifications';
    const onDateOfBirth =
      segments[0] === '(onboarding)' && segments[1] === 'date-of-birth';

    const inTabsGroup = segments[0] === '(tabs)';

    authLog('layout.profile', 'guardEval', {
      segments,
      isSignedIn,
      isLoaded,
      guestBrowseUnlocked,
      syncGuest,
      guestUnlocked,
      onboardingComplete,
      needsDateOfBirth,
      signedInOnboardingRoute,
      inAuthGroup,
      inOnboardingGroup,
      onDateOfBirth,
      inTabsGroup,
      profileOnboardingComplete: profile?.onboardingCompletedAt !== undefined,
      hasDateOfBirth: profile?.dateOfBirth !== undefined,
    });

    if (isSignedIn) {
      if (needsDateOfBirth && !onDateOfBirth) {
        safeReplace('/(onboarding)/date-of-birth', 'needsDateOfBirth');
      } else if (
        !needsDateOfBirth &&
        !onboardingComplete &&
        !inOnboardingGroup &&
        signedInOnboardingRoute
      ) {
        safeReplace(signedInOnboardingRoute, 'incompleteOnboarding');
      } else if (
        !needsDateOfBirth &&
        onboardingComplete &&
        (inAuthGroup || inOnboardingGroup || !segments[0])
      ) {
        safeReplace('/(tabs)/home', 'onboardingComplete');
      } else {
        authLog('layout.profile', 'guardNoAction', { branch: 'signedIn' });
      }
    } else if (!segments[0]) {
      if (guestUnlocked || inTabsGroup) {
        safeReplace('/(tabs)/home', 'emptySegmentGuest');
      } else {
        safeReplace('/(auth)', 'emptySegment');
      }
    } else if (!onboardingComplete && !inOnboardingGroup && !inAuthGroup && !inTabsGroup) {
      safeReplace(SHOWCASE_PATH, 'guestNotUnlocked');
    } else {
      authLog('layout.profile', 'guardNoAction', { branch: 'guest' });
    }
  }, [
    isSignedIn,
    segments,
    isLoaded,
    onboardingComplete,
    needsDateOfBirth,
    profile,
    guestBrowseUnlocked,
    signedInOnboardingRoute,
    safeReplace,
  ]);

  return <RootStack />;
}

function InitialLayout() {
  return (
    <ConvexQueryErrorBoundary
      fallback={<GuestOnlyLayout />}
      onError={(error) => {
        authLog('layout', 'convexErrorFallback', { message: error.message });
        console.warn('Convex profile query failed, using guest fallback:', error.message);
      }}
    >
      <ProfileAwareLayout />
    </ConvexQueryErrorBoundary>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void isGuestBrowseUnlocked();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" backgroundColor="#000" />
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <ConvexClerkProvider>
            <StripeAppProvider>
              <MobileAnalyticsObserver />
              <InitialLayout />
            </StripeAppProvider>
          </ConvexClerkProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
