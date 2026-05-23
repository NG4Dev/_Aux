import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function StartPage() {
  const { isSignedIn } = useAuth();

  // RootLayout/InitialLayout handles all redirection based on auth/onboarding state
  return null;
}
