import React from "react";
import { StyleSheet, View, Text, ImageBackground, Image } from "react-native";
import { router, Link, useLocalSearchParams } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { useWarmUpBrowser } from "@/components/SignInWith";
import { LinearGradient } from 'expo-linear-gradient';

export default function SelectionScreen() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const isSignUp = mode === 'signup';

  const handleSSO = async (strategy: any) => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(auth)/post-auth');
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image - Using Unsplash (Cafe aesthetic as per request) */}
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop" }} 
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* Blur/Gradient Overlay */}
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
            style={StyleSheet.absoluteFill}
            locations={[0.4, 0.7, 1]}
        />

        <View style={styles.content}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    {/* Placeholder Logo */}
                    <Text style={styles.logoText}>Aux</Text>
                </View>
                <Text style={styles.tagline}>Stay Informed.{"\n"}Stay Connected.</Text>
            </View>

            <View style={styles.buttonContainer}>
                <CustomButton
                text="Continue with email"
                style={styles.emailButton}
                icon="mail"
                iconColor="#fff"
                onPress={() => router.push(isSignUp ? "/(auth)/sign-up" : "/(auth)/sign-in")}
                />

                <CustomButton
                text={isSignUp ? "Continue with Facebook" : "Sign In with Facebook"}
                style={styles.facebookButton}
                icon="logo-facebook"
                iconColor="#fff"
                onPress={() => handleSSO('oauth_facebook')}
                />

                <CustomButton
                text={isSignUp ? "Continue with Google" : "Sign In with Google"}
                style={styles.googleButton}
                icon="logo-google"
                iconColor="#000"
                onPress={() => handleSSO('oauth_google')}
                />

                <CustomButton
                text={isSignUp ? "Continue with Apple" : "Sign In with Apple"}
                style={styles.appleButton}
                icon="logo-apple"
                iconColor="#fff"
                onPress={() => handleSSO('oauth_apple')}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    </Text>
                    <Link href={isSignUp ? "/(auth)/selection?mode=signin" : "/(auth)/selection?mode=signup"} style={styles.link}>
                        {isSignUp ? "Sign in" : "Sign up"}
                    </Link>
                </View>
            </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    gap: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#2ECDA7', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  tagline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 40,
  },
  buttonContainer: {
    gap: 12,
    width: "100%",
  },
  emailButton: {
    backgroundColor: "#1D8954", // Spotify Green
  },
  facebookButton: {
    backgroundColor: "#1877F2",
  },
  googleButton: {
    backgroundColor: "#fff",
  },
  appleButton: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  footerText: {
    color: "#ccc",
    fontSize: 14,
  },
  link: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
