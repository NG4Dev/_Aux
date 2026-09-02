import React, { useCallback, useState } from "react";

import { StyleSheet, View, Text, ImageBackground, Pressable, ActivityIndicator, Alert } from "react-native";

import { router, Link, useLocalSearchParams } from "expo-router";

import CustomButton from "@/components/CustomButton";

import { useSSO } from "@clerk/clerk-expo";

import * as WebBrowser from "expo-web-browser";

import { useWarmUpBrowser } from "@/components/SignInWith";

import { LinearGradient } from 'expo-linear-gradient';

import {

  completeSsoFlow,

  navigateToPostAuth,

  type SsoStrategy,

} from "@/services/completeSsoFlow";
import { authLog } from "@/services/authFlowLogger";



WebBrowser.maybeCompleteAuthSession();



export default function SelectionScreen() {

  useWarmUpBrowser();

  const { startSSOFlow } = useSSO();

  const { mode } = useLocalSearchParams<{ mode: string }>();

  const isSignUp = mode === 'signup';

  const [ssoLoading, setSsoLoading] = useState(false);



  const handleSSO = useCallback(async (strategy: SsoStrategy) => {

    try {

      setSsoLoading(true);
      authLog('selection', 'ssoStart', { strategy, mode: isSignUp ? 'signup' : 'signin' });

      const result = await completeSsoFlow(startSSOFlow, strategy);

      if (!result.ok) {
        authLog('selection', 'ssoIncomplete', { strategy, reason: result.reason });
        return;
      }

      authLog('selection', 'ssoSuccess', { strategy });
      navigateToPostAuth(router);

    } catch (err) {

      authLog('selection', 'ssoError', {
        message: err instanceof Error ? err.message : String(err),
      });
      console.error('SSO error:', err);

      Alert.alert(

        'Authentication Error',

        'Something went wrong during sign-in. Please try again.',

        [{ text: 'OK' }],

      );

    } finally {

      setSsoLoading(false);

    }

  }, [startSSOFlow, isSignUp]);



  return (

    <View style={styles.container}>

      <ImageBackground

        source={{ uri: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop" }} 

        style={StyleSheet.absoluteFill}

        resizeMode="cover"

      >

        <LinearGradient

            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}

            style={StyleSheet.absoluteFill}

            locations={[0.4, 0.7, 1]}

        />



        <View style={styles.content}>

            <View style={styles.header}>

                <View style={styles.logoContainer}>

                    <Text style={styles.logoText}>Aux</Text>

                </View>

                <Text style={styles.tagline}>Stay Informed.{"\n"}Stay Connected.</Text>

            </View>



            <View style={styles.buttonContainer}>

                <CustomButton

                text="Continue with email"

                style={styles.emailButton}

                icon="mail"

                iconColor="#fff"

                onPress={() => router.push(isSignUp ? "/(auth)/sign-up" : "/(auth)/sign-in")}

                />



                <CustomButton

                text={isSignUp ? "Continue with Facebook" : "Sign In with Facebook"}

                style={styles.facebookButton}

                icon="logo-facebook"

                iconColor="#fff"

                onPress={() => handleSSO('oauth_facebook')}

                disabled={ssoLoading}

                />



                <CustomButton

                text={isSignUp ? "Continue with Google" : "Sign In with Google"}

                style={styles.googleButton}

                icon="logo-google"

                iconColor="#000"

                onPress={() => handleSSO('oauth_google')}

                disabled={ssoLoading}

                />



                <CustomButton

                text={isSignUp ? "Continue with Apple" : "Sign In with Apple"}

                style={styles.appleButton}

                icon="logo-apple"

                iconColor="#fff"

                onPress={() => handleSSO('oauth_apple')}

                disabled={ssoLoading}

                />



                {ssoLoading ? (

                  <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />

                ) : null}



                <View style={styles.footer}>

                    <Text style={styles.footerText}>

                        {isSignUp ? "Already have an account?" : "Don't have an account?"}

                    </Text>

                    <Link href={isSignUp ? "/(auth)/selection?mode=signin" : "/(auth)/selection?mode=signup"} asChild>

                        <Pressable>

                            <Text style={styles.footerLink}>

                                {isSignUp ? "Sign in" : "Create account"}

                            </Text>

                        </Pressable>

                    </Link>

                </View>

            </View>

        </View>

      </ImageBackground>

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: "#000",

  },

  content: {

    flex: 1,

    justifyContent: "flex-end",

    padding: 24,

    paddingBottom: 48,

  },

  header: {

    marginBottom: 40,

  },

  logoContainer: {

    marginBottom: 16,

  },

  logoText: {

    fontSize: 32,

    fontWeight: "800",

    color: "#fff",

  },

  tagline: {

    fontSize: 28,

    fontWeight: "700",

    color: "#fff",

    lineHeight: 36,

  },

  buttonContainer: {

    gap: 12,

  },

  emailButton: {

    backgroundColor: "#1DB954",

  },

  facebookButton: {

    backgroundColor: "#1877F2",

  },

  googleButton: {

    backgroundColor: "#fff",

  },

  appleButton: {

    backgroundColor: "#000",

    borderWidth: 1,

    borderColor: "#fff",

  },

  footer: {

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 6,

    marginTop: 20,

  },

  footerText: {

    color: "#ccc",

    fontSize: 14,

  },

  footerLink: {

    color: "#1DB954",

    fontSize: 14,

    fontWeight: "600",

  },

});


