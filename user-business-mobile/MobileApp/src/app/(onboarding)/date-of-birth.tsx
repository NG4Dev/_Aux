import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import CustomButton from '@/components/CustomButton';
import DateOfBirthPicker, {
  DEFAULT_DOB,
  formatDateOfBirth,
} from '@/components/onboarding/DateOfBirthPicker';
import { api } from '@/convex/_generated/api';
import { getSignedInIncompleteOnboardingRoute } from '@/services/resolveAuthSession';
import { useOnboardingExitGuard } from '@/hooks/useOnboardingExitGuard';

export default function DateOfBirthScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const updateProfile = useMutation(api.userProfile.updateProfile);
  const completeStep = useMutation(api.userProfile.completeOnboardingStep);
  const [dob, setDob] = useState(DEFAULT_DOB);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const allowExitRef = useRef(false);
  const { gestureEnabled } = useOnboardingExitGuard({ allowExitRef });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/(onboarding)/showcase');
    }
  }, [isLoaded, isSignedIn]);

  const onContinue = async () => {
    setSaving(true);
    try {
      await updateProfile({ dateOfBirth: formatDateOfBirth(dob) });
      await completeStep({ step: 'dob' });
      const nextRoute = await getSignedInIncompleteOnboardingRoute();
      allowExitRef.current = true;
      router.replace(nextRoute as never);
    } finally {
      setSaving(false);
    }
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
      <SafeAreaView style={styles.safeArea}>
        <DateOfBirthPicker
          value={dob}
          onChange={(date) => {
            setTouched(true);
            setDob(date);
          }}
          subtitle="Required for age-restricted content and compliance. You must enter your real date of birth."
        />

        <View style={styles.footer}>
          <CustomButton
            text={saving ? 'Saving…' : 'Continue'}
            onPress={onContinue}
            style={styles.button}
            disabled={saving || !touched}
          />
        </View>
      </SafeAreaView>
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
  },
  safeArea: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    backgroundColor: '#fff',
  },
});
