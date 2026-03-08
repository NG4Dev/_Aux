import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack, router } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // If user is already signed in, skip auth entirely
  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Welcome' }} />
      <Stack.Screen name="selection" options={{ title: 'Get Started' }} />
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: true, title: 'Sign in', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ 
          headerShown: true, 
          title: 'Create account', 
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#000' }, 
          headerTintColor: '#fff',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color="#fff" 
              style={{ marginLeft: 10 }} 
              onPress={() => router.back()} 
            />
          ),
        }}
      />
      <Stack.Screen
        name="verify"
        options={{ headerShown: true, title: 'Verify', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}
      />
    </Stack>
  );
}
