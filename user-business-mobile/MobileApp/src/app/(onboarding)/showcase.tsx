import { BlurView } from 'expo-blur';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import FeatureCard from '@/components/FeatureCard';
import Marquee from '@/components/Marquee';
import CustomButton from '@/components/CustomButton';
import {
  completeGuestOnboarding,
  markGuestShowcaseSeen,
} from '@/services/onboarding';
import { authLog } from '@/services/authFlowLogger';
import { useOnboardingExitGuard } from '@/hooks/useOnboardingExitGuard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MARQUEE_HEIGHT = SCREEN_HEIGHT * 0.48;

const features = [
  {
    id: 1,
    title: 'Home Feed',
    description: 'Discover social posts and vibrant community events.',
    image: { uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=900&fit=crop' },
  },
  {
    id: 2,
    title: 'Discover Events',
    description: 'Find local events — Music, Arts, Food, and more.',
    image: { uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=900&fit=crop' },
  },
  {
    id: 3,
    title: 'Your Library',
    description: 'Keep track of bookmarked events and saved places.',
    image: { uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=900&fit=crop' },
  },
  {
    id: 4,
    title: 'Secure Payments',
    description: 'Manage your wallet and pay for events seamlessly.',
    image: { uri: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=900&fit=crop' },
  },
  {
    id: 5,
    title: 'AI Assistant',
    description: 'Get smart suggestions and help from our AI assistant.',
    image: { uri: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=900&fit=crop' },
  },
];

export default function ShowcaseScreen() {
  const { isSignedIn } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const allowExitRef = useRef(false);
  const { gestureEnabled } = useOnboardingExitGuard({ allowExitRef });

  const onGetStarted = async () => {
    authLog('showcase', 'getStarted', { isSignedIn: !!isSignedIn });
    allowExitRef.current = true;
    if (isSignedIn) {
      await markGuestShowcaseSeen();
      authLog('showcase', 'navigate', { to: '/(onboarding)/preferences', reason: 'signedIn' });
      router.replace('/(onboarding)/preferences');
      return;
    }
    await completeGuestOnboarding();
    authLog('showcase', 'navigate', { to: '/(tabs)/home', reason: 'guest' });
    router.replace('/(tabs)/home');
  };

  const activeFeature = features[activeIndex];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled }} />
      {activeFeature && (
        <Animated.Image
          key={activeFeature.id}
          source={activeFeature.image}
          style={styles.backgroundImage}
          resizeMode="cover"
          entering={FadeIn.duration(1000)}
          exiting={FadeOut.duration(1000)}
        />
      )}

      <View style={styles.overlay} />

      <BlurView intensity={70} style={styles.blurView}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <Animated.View
            style={styles.marqueeContainer}
            entering={SlideInUp.springify().mass(1).damping(30)}>
            <Marquee
              items={features}
              renderItem={({ item }) => <FeatureCard item={item} />}
              onIndexChange={setActiveIndex}
            />
          </Animated.View>

          <View style={styles.bottomContent}>
            <Animated.Text
              key={`title-${activeFeature?.id}`}
              style={styles.featureTitle}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}>
              {activeFeature?.title}
            </Animated.Text>
            <Animated.Text
              key={`desc-${activeFeature?.id}`}
              style={styles.featureDescription}
              entering={FadeIn.duration(300).delay(80)}
              exiting={FadeOut.duration(200)}>
              {activeFeature?.description}
            </Animated.Text>

            <View style={styles.buttonContainer}>
              <CustomButton
                text="Get Started"
                onPress={onGetStarted}
                style={styles.getStartedButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
  } as ImageStyle,
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  marqueeContainer: {
    marginTop: 60,
    height: MARQUEE_HEIGHT,
    width: '100%',
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  getStartedButton: {
    backgroundColor: '#fff',
    width: '100%',
  },
});
