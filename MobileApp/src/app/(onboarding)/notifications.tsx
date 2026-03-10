import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";

export default function NotificationsScreen() {
  const handleEnable = async () => {
    // TODO: Request push notification permissions here
    // For now, just navigate to the dashboard
    router.replace("/(tabs)/home");
  };

  const handleDismiss = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Notification icon placeholder */}
        <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
                <Text style={styles.bellIcon}>🔔</Text>
            </View>
        </View>

        <Text style={styles.title}>Turn on notifications</Text>
        <Text style={styles.description}>
          Get updates about new music, special offers, events and more.
        </Text>

        <View style={styles.buttonContainer}>
          <CustomButton
            text="Turn on notifications"
            style={styles.enableButton}
            onPress={handleEnable}
          />

          <Pressable onPress={handleDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>
          Manage your notification categories in Settings at any time.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // Dark background
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 48,
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
    maxWidth: 300,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: "#fff",
    width: "100%", // Full width within container
  },
  dismissButton: {
    padding: 10,
  },
  dismissText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footnote: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
    maxWidth: 250,
  },
});
