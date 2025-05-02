import CustomButton from "./CustomButton";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useCallback } from "react";
import { useSSO } from '@clerk/clerk-expo'
import * as AuthSession from 'expo-auth-session'
import { router } from "expo-router";
import { Alert, Platform } from "react-native";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession()

export default function SignInWith() {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO()

  const onPress = useCallback(async () => {
    try {
      console.log("Starting SSO flow with Google...");
      
      // Create a proper redirect URL with scheme
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: Platform.OS === 'web' ? undefined : 'aux', // Using the correct scheme from app.json
        path: 'oauth-native-callback'
      });
      
      console.log("Using redirect URL:", redirectUrl);
      
      // Start the authentication process by calling `startSSOFlow()`
      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: redirectUrl,
      });
      
      console.log("SSO flow result:", JSON.stringify(result, null, 2));
      
      const { createdSessionId, setActive, signIn, signUp, authSessionResult } = result;

      // If sign in was successful, set the active session
      if (createdSessionId) {
        console.log("Session created, ID:", createdSessionId);
        await setActive!({ session: createdSessionId });
        console.log("Session activated, redirecting to home");
        // After successful authentication, redirect to protected route
        router.replace('/(protected)/(tabs)/home');
      } else if (signIn) {
        // Handle sign in flow if needed
        console.log("Sign in flow needed, status:", signIn.status);
        
        if (signIn.status === "complete") {
          await setActive!({ session: signIn.createdSessionId });
          router.replace('/(protected)/(tabs)/home');
        } else if (signIn.status === "needs_identifier") {
          if (authSessionResult?.type === "dismiss") {
            // User dismissed the auth window
            console.log("Authentication window dismissed by user");
            Alert.alert(
              "Authentication Incomplete",
              "Please complete the Google sign-in process to continue.",
              [{ text: "Try Again", onPress: onPress }]
            );
          } else if (signIn.firstFactorVerification?.externalVerificationRedirectURL) {
            // Try to continue the OAuth flow with a different approach
            console.log("Continuing OAuth flow with external URL");
            
            // Use a different browser approach
            const authResult = await WebBrowser.openAuthSessionAsync(
              String(signIn.firstFactorVerification.externalVerificationRedirectURL),
              redirectUrl,
              { showInRecents: true }
            );
            
            console.log("Auth result:", authResult);
            
            if (authResult.type === "success") {
              // Try to complete the sign-in
              Alert.alert(
                "Authentication",
                "Please wait while we complete your sign-in...",
                [{ text: "OK" }]
              );
              
              // Refresh the page to complete the sign-in
              router.replace('/(auth)/sign-in');
            } else {
              Alert.alert(
                "Authentication Failed",
                "Unable to complete sign-in with Google. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        }
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        console.log("Authentication incomplete - no session created");
        Alert.alert(
          "Authentication Failed",
          "Unable to complete sign-in with Google. Please try again or use email sign-in.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error("SSO error:", JSON.stringify(err, null, 2));
      Alert.alert(
        "Authentication Error",
        "An error occurred during sign-in. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, []);
  
  return <CustomButton text="Sign in with Google" onPress={onPress} />;
}
