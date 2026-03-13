import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { isOnboardingCompleted } from "@/services/onboarding";
import { useEffect, useState } from "react";

export default function PostAuthScreen() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await isOnboardingCompleted();
      setOnboardingDone(completed);
    };
    checkOnboarding();
  }, []);

  const handleRememberDevice = () => {
    // TODO: Implement device remembrance logic (e.g., long-lived session or AsyncStorage flag)
    if (onboardingDone) {
      router.replace("/notifications");
    } else {
      router.replace("/showcase");
    }
  };

  const handleSetPassword = () => {
    router.push("/(auth)/reset-password"); // We'll create this or use a step
  };

  const handleSkip = () => {
    if (onboardingDone) {
      router.replace("/notifications");
    } else {
      router.replace("/showcase");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>You're in!</Text>
        <Text style={styles.description}>
          We're glad you're here.{"\n"}
          To make things easier next time, press a button that works best for you.
        </Text>

        <View style={styles.buttonContainer}>
          <CustomButton
            text="Remember this device"
            style={styles.rememberButton}
            onPress={handleRememberDevice}
          />

          <CustomButton
            text="Set a new password"
            style={styles.setPasswordButton}
            onPress={handleSetPassword}
          />

          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
    gap: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
    marginTop: 20,
  },
  rememberButton: {
    backgroundColor: "#A881E6", // Purple from Figma
    width: "100%",
  },
  setPasswordButton: {
    backgroundColor: "#1D8954", // Teal/Green from Figma
    width: "100%",
  },
  skipButton: {
    padding: 15,
    alignItems: "center",
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});