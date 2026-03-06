import React from "react";
import { StyleSheet, View, Text, ImageBackground } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useWarmUpBrowser } from "@/components/SignInWith";
import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";

export default function SelectionScreen() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();

  const handleSSO = async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={styles.container}>
      {/* Background image with blur effect */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          {/* TODO: Replace with actual app logo */}
          <Text style={styles.logoText}>☘</Text>
          <Text style={styles.tagline}>Stay Informed.{"\n"}Stay Connected.</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Continue with email"
          style={styles.emailButton}
          onPress={() => router.push("/(auth)/sign-in")}
        />

        <CustomButton
          text="Continue with Facebook"
          style={styles.facebookButton}
          onPress={() => handleSSO('oauth_facebook')}
        />

        <CustomButton
          text="Continue with Google"
          style={styles.googleButton}
          onPress={() => handleSSO('oauth_google')}
        />

        <CustomButton
          text="Continue with Apple"
          style={styles.appleButton}
          onPress={() => handleSSO('oauth_apple')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Text
            style={styles.footerLink}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "flex-end",
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    gap: 12,
  },
  logoText: {
    fontSize: 64,
    color: "#2ECDA7",
  },
  tagline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    gap: 10,
  },
  emailButton: {
    backgroundColor: "#2ECDA7",
    borderRadius: 6,
  },
  facebookButton: {
    backgroundColor: "#1877F2",
    borderRadius: 6,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
  },
  appleButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: "#999",
    fontSize: 14,
  },
  footerLink: {
    color: "#2ECDA7",
    fontWeight: "600",
  },
});
