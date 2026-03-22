import CustomButton from "./CustomButton";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useCallback } from "react";
import { useSSO } from '@clerk/clerk-expo'
import * as AuthSession from 'expo-auth-session'
import { router } from "expo-router";
import { Alert, Platform, StyleSheet, View } from "react-native";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
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

  const handleSSO = useCallback(async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    try {
      // Create a proper redirect URL with scheme
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'aux',
        path: 'oauth-native-callback'
      });
      
      // Start the authentication process by calling `startSSOFlow()`
      const result = await startSSOFlow({
        strategy,
        redirectUrl,
      });
      
      const { createdSessionId, setActive, signIn } = result;

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      } else if (signIn && signIn.status === "complete") {
        await setActive!({ session: signIn.createdSessionId });
      }
    } catch (err) {
      console.error("SSO error:", JSON.stringify(err, null, 2));
      Alert.alert(
        "Authentication Error",
        "An error occurred during sign-in. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [startSSOFlow]);

  return (
    <View style={styles.container}>
      <CustomButton 
        text="Sign in with Google" 
        onPress={() => handleSSO('oauth_google')} 
        icon="logo-google"
        style={styles.googleButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginTop: 20,
    },
    googleButton: {
        backgroundColor: '#fff',
    }
});