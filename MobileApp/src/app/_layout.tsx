import { Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { isOnboardingCompleted } from "@/services/onboarding";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  )
}

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await isOnboardingCompleted();
      setOnboardingDone(completed);
    };
    checkOnboarding();
  }, [segments]);

  useEffect(() => {
    if (!isLoaded || onboardingDone === null) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'selection' || segments[0] === 'sign-in' || segments[0] === 'sign-up';
    const inOnboardingGroup = segments[0] === '(onboarding)' || segments[0] === 'showcase' || segments[0] === 'notifications';
    const inTabsGroup = segments[0] === '(tabs)' || segments[0] === 'home' || segments[0] === 'discover';
    
    if (isSignedIn) {
      if (onboardingDone === false && !inOnboardingGroup) {
        router.replace('/showcase');
      } else if (onboardingDone === true && (inAuthGroup || !segments[0])) {
        router.replace('/home');
      }
    } else {
      if (!segments[0]) {
        router.replace('/(auth)');
      }
    }
  }, [isSignedIn, segments, isLoaded, onboardingDone]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="wallet" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <InitialLayout />
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}