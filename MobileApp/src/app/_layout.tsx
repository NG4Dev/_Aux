import { Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

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

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // Identify protected paths
    const segmentArray = segments as string[];
    const segmentOne = segmentArray.length > 1 ? segmentArray[1] : null;
    const inProtectedRoute = 
      (segmentArray[0] === '(tabs)' && (segmentOne === 'pay' || segmentOne === 'library')) ||
      segmentArray[0] === 'wallet';

    if (isSignedIn && inAuthGroup) {
      // If user is signed in and in auth group, they should probably be elsewhere
      // But we might want them to finish onboarding first
      // For now, let's just let the layouts handle it or redirect to home
      // router.replace('/(tabs)/home');
    } else if (!isSignedIn && inProtectedRoute) {
      // If user is not signed in and tries to access a protected route, redirect to auth
      router.replace('/(auth)');
    }
  }, [isSignedIn, segments, isLoaded]);

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
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <InitialLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}