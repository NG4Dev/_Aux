import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  CONVEX_JWT_TEMPLATE,
  resolveAuthSession,
  waitForClerkToken,
} from '@/services/resolveAuthSession';
import { authLog } from '@/services/authFlowLogger';
import { Toast } from '@/components/Toast';

export default function PostAuthScreen() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const ensureCurrentWithStatus = useMutation(api.users.ensureCurrentWithStatus);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) {
      authLog('postAuth', 'wait', { reason: 'clerkNotLoaded' });
      return;
    }
    if (!isSignedIn) {
      authLog('postAuth', 'wait', { reason: 'notSignedIn' });
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    authLog('postAuth', 'start', {});

    void (async () => {
      try {
        const status = await resolveAuthSession(
          () => ensureCurrentWithStatus({}),
          router,
          {
            onNewUser: () => {
              authLog('postAuth', 'newUserToast', {});
              setInfoToast('Signing you up…');
            },
            waitForConvexAuth: () =>
              waitForClerkToken(() =>
                getToken({ template: CONVEX_JWT_TEMPLATE }),
              ),
          },
        );
        authLog('postAuth', 'success', {
          isNewUser: status.isNewUser,
          hasDateOfBirth: status.hasDateOfBirth,
          onboardingComplete: status.onboardingComplete,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        authLog('postAuth', 'error', { message });
        console.warn('post-auth resolve failed', err);
        const emailClaimMissing = message.includes('missing an email claim');
        setError(
          emailClaimMissing
            ? 'Sign-in succeeded but your account could not sync. Try email sign-in, or contact support if this persists.'
            : 'Could not finish sign-in. Please try again.',
        );
        startedRef.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, ensureCurrentWithStatus, getToken]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => router.replace('/(auth)/selection?mode=signin')}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1DB954" />
      {infoToast ? (
        <Toast message={infoToast} onHide={() => setInfoToast(null)} duration={3000} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
