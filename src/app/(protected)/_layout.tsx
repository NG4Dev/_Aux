import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Slot } from 'expo-router';

export default function ProtectedLayout() {
    console.log ('Protected layout')

    const { isSignedIn } = useAuth();
    
    if (!isSignedIn) {
      return <Redirect href='/sign-in' />
    }

    return <Slot/>;
}

