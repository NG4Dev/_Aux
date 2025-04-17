import { Text, StyleSheet, View, Button } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function HomeScreen() {
  const { signOut, isSignedIn } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome screen</Text>

      <Text>{isSignedIn ? 'Authenticated' : 'Not authenticated'}</Text>
      <Button title='Sign out' onPress={() => signOut()}  />

      <Link href='/sign-in'>Go to sign in</Link>

      <Link href='/(protected)' style={styles.link}>Go to protected screens</Link>
    </View>
  );
}





const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  link: {
    color: 'blue',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});