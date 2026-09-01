import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { useAuth } from '@clerk/clerk-expo';
import { authLog } from '@/services/authFlowLogger';
import AuthWelcomeVideo from '@/components/auth/AuthWelcomeVideo';

export default function AuthSplashScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    authLog('authIndex', 'redirect', {
      to: '/(auth)/post-auth',
      reason: 'alreadySignedIn',
    });
    router.replace('/(auth)/post-auth');
  }, [isSignedIn, isLoaded]);

  if (!isLoaded || isSignedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuthWelcomeVideo />

      <View style={styles.content} />

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Sign in"
          style={styles.purpleButton}
          onPress={() => router.push('/(auth)/selection?mode=signin')}
        />

        <CustomButton
          text="Create account"
          style={styles.greenButton}
          onPress={() => router.push('/(auth)/selection?mode=signup')}
        />

        <CustomButton
          text="Continue as guest"
          style={styles.transparentButton}
          onPress={() => {
            authLog('authIndex', 'continueAsGuest', {
              to: '/(onboarding)/showcase',
            });
            router.replace('/(onboarding)/showcase');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
    paddingBottom: 40,
  },
  purpleButton: {
    backgroundColor: '#A881E6',
  },
  greenButton: {
    backgroundColor: '#1DB954',
  },
  transparentButton: {
    backgroundColor: 'transparent',
  },
});
