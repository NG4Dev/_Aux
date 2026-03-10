import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function StartPage() {
  const { isSignedIn } = useAuth();

  // If the user is already signed in, skip auth and go to tabs
  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Otherwise, send them to the auth splash (video screen)
  return <Redirect href="/(auth)" />;
}
