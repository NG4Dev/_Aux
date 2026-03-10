import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack, router } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // If user is already signed in, skip auth entirely
  if (isSignedIn) {
    // Note: In a real app, we might want to check if onboarding is complete
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Welcome' }} />
      <Stack.Screen name="selection" options={{ title: 'Get Started' }} />
      <Stack.Screen
        name="sign-in"
        options={{ 
          headerShown: true, 
          title: 'Sign in', 
          headerStyle: { backgroundColor: '#000' }, 
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ 
          headerShown: true, 
          title: 'Create account', 
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#000' }, 
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="verify"
        options={{ 
          headerShown: true, 
          title: 'Verify', 
          headerStyle: { backgroundColor: '#000' }, 
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="post-auth"
        options={{ 
          headerShown: false,
          title: "You're in!",
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ 
          headerShown: true, 
          title: 'Create account', 
          headerStyle: { backgroundColor: '#000' }, 
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}