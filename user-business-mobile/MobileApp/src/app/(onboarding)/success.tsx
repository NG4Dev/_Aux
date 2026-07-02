import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authLog } from '@/services/authFlowLogger';
import { useOnboardingExitGuard } from '@/hooks/useOnboardingExitGuard';

export default function SuccessScreen() {
  const [showSpinner, setShowSpinner] = useState(false);
  const { user } = useUser();
  const updateProfile = useMutation(api.userProfile.updateProfile);
  const startedRef = useRef(false);
  const { gestureEnabled } = useOnboardingExitGuard();

  useEffect(() => {
    async function syncProfile() {
      if (!user || startedRef.current) return;
      startedRef.current = true;

      authLog('success', 'syncProfileStart', {
        hasDob: typeof user.unsafeMetadata?.dob === 'string',
      });

      try {
        const dob = user.unsafeMetadata?.dob;

        if (typeof dob === 'string') {
          const isoDate = dob.includes('T') ? dob.split('T')[0] : dob;
          await updateProfile({ dateOfBirth: isoDate });
          authLog('success', 'dobSynced', { isoDate });
        }

        authLog('success', 'navigate', { to: '/(auth)/post-auth' });
        router.replace('/(auth)/post-auth');
      } catch (err) {
        authLog('success', 'syncError', {
          message: err instanceof Error ? err.message : String(err),
        });
        console.warn('Failed to sync profile after sign-up', err);
        authLog('success', 'navigate', { to: '/(auth)/post-auth', fallback: true });
        router.replace('/(auth)/post-auth');
      }
    }

    void syncProfile();
  }, [user, updateProfile]);

  useEffect(() => {
    const checkmarkTimer = setTimeout(() => {
      setShowSpinner(true);
    }, 1500);

    return () => {
      clearTimeout(checkmarkTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled }} />
      {showSpinner ? (
        <ActivityIndicator size="large" color="#2ECDA7" />
      ) : (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1D8954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
});
