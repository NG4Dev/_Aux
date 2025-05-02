import { useAuth } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';

export default function ProtectedLayout() {
  console.log('Protected layout')

  const { isSignedIn } = useAuth();
    
  if (!isSignedIn) {
    return <Redirect href='/sign-in' />
  }

  return (
    <Stack 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
        // Ensure headers are shown by default
        headerShown: false,
        // Enable back button by default
        headerBackVisible: true,
        // Add a back title
        headerBackTitle: 'Back',
      }}
    >
      {/* Bottom tabs */}
      <Stack.Screen
        name="(tabs)"
      />
    </Stack>
  );
}
