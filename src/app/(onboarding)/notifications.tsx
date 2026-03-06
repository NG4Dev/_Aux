import { View, Text, StyleSheet, Image } from "react-native";
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
          <Text style={styles.bellIcon}>🔔</Text>
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

          <Text style={styles.dismissText} onPress={handleDismiss}>
            Not now
          </Text>
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
    backgroundColor: "#111",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    marginBottom: 10,
  },
  bellIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
    marginTop: 10,
  },
  enableButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
  },
  dismissText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  footnote: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});
