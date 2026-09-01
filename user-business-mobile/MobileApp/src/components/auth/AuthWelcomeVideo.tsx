import { useEffect, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { useIsFocused } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

function AuthWelcomePlaceholder() {
  return (
    <ImageBackground
      source={require('@assets/images/onboarding-discover-dark.png')}
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      resizeMode="cover"
    />
  );
}

function AuthWelcomeVideoPlayer() {
  const player = useVideoPlayer(require('@assets/videos/welcome-bg-video.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

/**
 * Splash video — mounts the player only while this route is focused and the app
 * is foreground. Auth index also uses unmountOnBlur for full teardown on nav/OAuth.
 */
export default function AuthWelcomeVideo() {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      setAppActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  if (!isFocused || !appActive) {
    return <AuthWelcomePlaceholder />;
  }

  return <AuthWelcomeVideoPlayer />;
}
