import { Stack } from 'expo-router';

export default function AuthLayout() {
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
