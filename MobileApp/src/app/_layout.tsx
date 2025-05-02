import { Slot, useSegments, useRouter } from "expo-router";
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";

// Optional: Create a loading component for better UX
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={{ marginTop: 10 }}>Loading...</Text>
    </View>
  );
}

// Create a wrapper component to handle auth state
function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inProtectedGroup = segments[0] === '(protected)';

    if (isSignedIn && !inProtectedGroup) {
      // If user is signed in but not in protected group, redirect to protected home
      router.replace('/(protected)/(tabs)/home');
    } else if (!isSignedIn && inProtectedGroup) {
      // If user is not signed in but trying to access protected group, redirect to auth
      router.replace('/(auth)');
    }
  }, [isSignedIn, segments, isLoaded]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  console.log("Root layout");
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}