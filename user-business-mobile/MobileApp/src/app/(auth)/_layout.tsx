import { Stack } from 'expo-router';
import { AUTH_HEADER_OPTIONS, DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function AuthLayout() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="index" options={{ title: 'Welcome' }} />
      <Stack.Screen name="selection" options={{ title: 'Get Started' }} />
      <Stack.Screen
        name="sign-in"
        options={{
          headerShown: true,
          title: 'Sign in',
          ...AUTH_HEADER_OPTIONS,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerShown: true,
          title: 'Create account',
          ...AUTH_HEADER_OPTIONS,
        }}
      />
      <Stack.Screen
        name="verify"
        options={{
          headerShown: true,
          title: 'Verify',
          ...AUTH_HEADER_OPTIONS,
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
          ...AUTH_HEADER_OPTIONS,
        }}
      />
    </Stack>
  );
}
