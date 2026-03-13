import { Text, StyleSheet, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import GuestPromptScreen from "@/components/GuestPromptScreen";

export default function LibraryScreen() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <GuestPromptScreen feature="Library" />;
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
