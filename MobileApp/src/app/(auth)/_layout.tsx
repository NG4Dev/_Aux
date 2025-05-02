import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
    console.log ('Auth layout')

    const { isSignedIn } = useAuth();
    
    if (isSignedIn) {
        return <Redirect href={"/homepage"} />
    } 

    return(
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false, title: 'splash'}} />
      <Stack.Screen name='sign-in' options={{ title: 'Sign in' }} />
      <Stack.Screen name='sign-up' options={{ title: 'Sign up' }} />
      <Stack.Screen name='verify' options={'Verify account'}/>
    </Stack>

    );
}

