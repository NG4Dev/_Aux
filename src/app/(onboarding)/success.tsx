import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";

export default function SuccessScreen() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Show green checkmark for 1.5s, then switch to spinner
    const checkmarkTimer = setTimeout(() => {
      setShowSpinner(true);
    }, 1500);

    // After spinner shows for 1.5s, navigate to notifications
    const navigationTimer = setTimeout(() => {
      router.replace("/(onboarding)/notifications");
    }, 3000);

    return () => {
      clearTimeout(checkmarkTimer);
      clearTimeout(navigationTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      {showSpinner ? (
        <ActivityIndicator size="large" color="#2ECDA7" />
      ) : (
        <Text style={styles.checkmark}>✅</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  checkmark: {
    fontSize: 80,
  },
});
