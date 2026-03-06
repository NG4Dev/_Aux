import { Text, StyleSheet, View } from "react-native";

export default function PayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay</Text>
      <Text style={styles.subtitle}>Manage your payments</Text>
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
