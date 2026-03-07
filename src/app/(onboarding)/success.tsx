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
        <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
        </View>
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
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1D8954', // Spotify Green
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000', // Black checkmark
  },
});
