import CustomButton from "./CustomButton";

import * as WebBrowser from "expo-web-browser";

import { useEffect, useCallback } from "react";

import { useSSO } from '@clerk/clerk-expo'

import { router } from "expo-router";

import { Alert, StyleSheet, View } from "react-native";

import {

  completeSsoFlow,

  navigateToPostAuth,

  type SsoStrategy,

} from "@/services/completeSsoFlow";
import { authLog } from "@/services/authFlowLogger";



export const useWarmUpBrowser = () => {

  useEffect(() => {

    void WebBrowser.warmUpAsync();

    return () => {

      void WebBrowser.coolDownAsync();

    };

  }, []);

};



WebBrowser.maybeCompleteAuthSession()



type SignInWithProps = {

  onNewUser?: () => void;

};



export default function SignInWith({ onNewUser: _onNewUser }: SignInWithProps) {

  useWarmUpBrowser();



  const { startSSOFlow } = useSSO();



  const handleSSO = useCallback(async (strategy: SsoStrategy) => {

    try {

      authLog('signInWith', 'ssoStart', { strategy });
      const result = await completeSsoFlow(startSSOFlow, strategy);

      if (!result.ok) {
        authLog('signInWith', 'ssoIncomplete', { strategy, reason: result.reason });
        return;
      }

      authLog('signInWith', 'ssoSuccess', { strategy });
      navigateToPostAuth(router);

    } catch (err) {

      authLog('signInWith', 'ssoError', {
        message: err instanceof Error ? err.message : String(err),
      });
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


