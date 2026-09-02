import { View, Text, StyleSheet } from "react-native";

export default function AuthSplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Splash Screen</Text>
      <Text style={styles.subtitle}>
        Please wait while we authenticate you...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
  },
});

