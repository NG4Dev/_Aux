import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '@clerk/clerk-expo';
import { authLog } from '@/services/authFlowLogger';

export default function AuthSplashScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const [videoReady, setVideoReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    authLog('authIndex', 'redirect', {
      to: '/(auth)/post-auth',
      reason: 'alreadySignedIn',
    });
    router.replace('/(auth)/post-auth');
  }, [isSignedIn, isLoaded]);

  const player = useVideoPlayer(
    require('@assets/videos/welcome-bg-video.mp4'),
    (p) => {
      if (!mountedRef.current) return;
      p.loop = true;
      p.muted = true;
      p.play();
      setVideoReady(true);
    },
  );

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // Player may already be released on unmount.
      }
    };
  }, [player]);

  if (isSignedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {videoReady ? (
        <VideoView
          player={player}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}

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
