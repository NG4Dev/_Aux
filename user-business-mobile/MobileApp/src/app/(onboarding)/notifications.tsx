import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { router, Stack } from 'expo-router';
import { api } from '@/convex/_generated/api';
import CustomButton from '@/components/CustomButton';
import { useOnboardingExitGuard } from '@/hooks/useOnboardingExitGuard';

export default function NotificationsScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const setNotificationSettings = useMutation(
    api.userProfile.setNotificationSettings,
  );
  const completeStep = useMutation(api.userProfile.completeOnboardingStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowExitRef = useRef(false);
  const { gestureEnabled } = useOnboardingExitGuard({ allowExitRef });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/(tabs)/home');
    }
  }, [isLoaded, isSignedIn]);

  const finish = async (pushEnabled: boolean) => {
    if (!isSignedIn) return;

    setSaving(true);
    setError(null);
    try {
      await setNotificationSettings({
        pushEnabled,
        orderUpdates: true,
        marketing: pushEnabled,
      });
      await completeStep({ step: 'notifications', markComplete: true });
      allowExitRef.current = true;
      router.replace('/(tabs)/home');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not finish onboarding';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnable = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    await finish(status === 'granted');
  };

  const handleDismiss = async () => {
    await finish(false);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled }} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.bellIcon}>🔔</Text>
          </View>
        </View>

        <Text style={styles.title}>Turn on notifications</Text>
        <Text style={styles.description}>
          Get updates about new music, special offers, events and more.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonContainer}>
          <CustomButton
            text={saving ? 'Saving…' : 'Turn on notifications'}
            style={styles.enableButton}
            onPress={handleEnable}
            disabled={saving}
          />

          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            disabled={saving}
          >
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>
          Manage your notification categories in Settings at any time.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: '#1D8954',
    width: '100%',
  },
  dismissButton: {
    padding: 10,
  },
  dismissText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footnote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
    maxWidth: 250,
  },
});

