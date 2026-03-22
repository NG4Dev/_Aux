import { Text, StyleSheet, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import GuestEmptyState from "@/components/GuestEmptyState";

export default function LibraryScreen() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <GuestEmptyState
        feature="Library"
        icon="bookmark-outline"
        description="Your saved events, places, and bookmarks will appear here."
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>Your collection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
});
