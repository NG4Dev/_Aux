import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';

const NOTIFICATIONS_KEY = 'user_notifications_handled';

export default function NotificationsScreen() {
  useEffect(() => {
    checkIfHandled();
  }, []);

  const checkIfHandled = async () => {
    const handled = await SecureStore.getItemAsync(NOTIFICATIONS_KEY);
    if (handled === 'true') {
      router.replace("/(tabs)/chat");
    }
  };

  const handleEnable = async () => {
    // TODO: Request push notification permissions here
    await SecureStore.setItemAsync(NOTIFICATIONS_KEY, 'true');
    router.replace("/(tabs)/chat");
  };

  const handleDismiss = async () => {
    await SecureStore.setItemAsync(NOTIFICATIONS_KEY, 'true');
    router.replace("/(tabs)/chat");
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
    backgroundColor: "#000", // Dark background to match Figma
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
    backgroundColor: '#1A1A1A',
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
    backgroundColor: "#1D8954", // Teal/Green to match create account flow
    width: "100%",
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