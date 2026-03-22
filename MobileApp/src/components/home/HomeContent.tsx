import { Text, StyleSheet, View, Button } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function HomeContent() {
  const { signOut, isSignedIn } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        {isSignedIn ? "Welcome back!" : "Browsing as guest"}
      </Text>

      {isSignedIn && (
        <Button title="Sign out" onPress={() => signOut()} />
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
    gap: 20,
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
