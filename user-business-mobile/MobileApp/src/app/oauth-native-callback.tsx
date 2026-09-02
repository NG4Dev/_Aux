import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { authLog } from '@/services/authFlowLogger';

WebBrowser.maybeCompleteAuthSession();

/** Let startSSOFlow on the caller screen finish before giving up. */
const UNSIGNED_FALLBACK_MS = 12_000;

export default function OAuthNativeCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    authLog('oauthCallback', 'mount', { isLoaded, isSignedIn });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      authLog('oauthCallback', 'wait', { reason: 'clerkNotLoaded' });
      return;
    }

    if (isSignedIn) {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      authLog('oauthCallback', 'redirect', {
        isSignedIn: true,
        to: '/(auth)/post-auth',
      });
      router.replace('/(auth)/post-auth');
      return;
    }

    authLog('oauthCallback', 'wait', {
      reason: 'awaitingSsoFlow',
      fallbackMs: UNSIGNED_FALLBACK_MS,
    });

    fallbackTimerRef.current = setTimeout(() => {
      authLog('oauthCallback', 'redirect', {
        isSignedIn: false,
        to: '/(auth)/selection?mode=signin',
        reason: 'fallbackTimeout',
      });
      router.replace('/(auth)/selection?mode=signin');
    }, UNSIGNED_FALLBACK_MS);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
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
