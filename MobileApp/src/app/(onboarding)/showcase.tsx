import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, ImageStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeatureCard from '@/components/FeatureCard';
import Marquee from '@/components/Marquee';
import CustomButton from '@/components/CustomButton';
import { markOnboardingComplete } from '@/services/onboarding';
import { useAuth } from '@clerk/clerk-expo';

const features = [
  {
    id: 1,
    title: 'Home Feed',
    description: 'Discover social posts and vibrant community events.',
    image: require('../../../assets/images/onboarding-home-dark.png'),
  },
  {
    id: 2,
    title: 'Discover Events',
    description: 'Find local events categories like Music, Arts, and Food.',
    image: require('../../../assets/images/onboarding-discover-dark.png'),
  },
  {
    id: 3,
    title: 'Your Library',
    description: 'Keep track of bookmarked events and saved places.',
    image: require('../../../assets/images/onboarding-library-dark.png'),
  },
  {
    id: 4,
    title: 'Secure Payments',
    description: 'Manage your wallet and pay for events seamlessly.',
    image: require('../../../assets/images/onboarding-pay-dark.png'),
  },
  {
    id: 5,
    title: 'AI Assistant',
    description: 'Get smart suggestions and help from our AI assistant.',
    image: require('../../../assets/images/onboarding-ai-dark.png'),
  },
];

export default function ShowcaseScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { isSignedIn } = useAuth();

  const onGetStarted = async () => {
    await markOnboardingComplete();
    if (isSignedIn) {
      router.replace('/notifications');
    } else {
      router.replace('/home');
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      {features[activeIndex] && (
        <Animated.Image
          key={features[activeIndex].id}
          source={features[activeIndex].image}
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
              style={styles.welcomeText}
              entering={FadeIn.duration(500).delay(500)}>
              Welcome to the App
            </Animated.Text>
            <Animated.Text
              style={styles.descriptionText}
              entering={FadeIn.duration(500).delay(700)}>
              Experience the best events and community features tailored for you.
            </Animated.Text>

            <View style={styles.buttonContainer}>
              <CustomButton
                text="Get Started"
                onPress={onGetStarted}
                style={styles.getStartedButton}
              />
              <CustomButton
                text="Skip"
                onPress={handleSkip}
                style={styles.skipButton}
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
    height: '50%',
    width: '100%',
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
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
  skipButton: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});
