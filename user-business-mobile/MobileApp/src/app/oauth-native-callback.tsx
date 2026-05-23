import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { authLog } from '@/services/authFlowLogger';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    authLog('oauthCallback', 'mount', { isLoaded, isSignedIn });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      authLog('oauthCallback', 'wait', { reason: 'clerkNotLoaded' });
      return;
    }

    if (isSignedIn) {
      authLog('oauthCallback', 'redirect', {
        isSignedIn: true,
        to: '/(auth)/post-auth',
      });
      router.replace('/(auth)/post-auth');
    } else {
      authLog('oauthCallback', 'redirect', {
        isSignedIn: false,
        to: '/(auth)/selection?mode=signin',
      });
      router.replace('/(auth)/selection?mode=signin');
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
