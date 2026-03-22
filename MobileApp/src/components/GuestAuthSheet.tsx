import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

type GuestAuthSheetProps = {
  onDismiss: () => void;
};

export default function GuestAuthSheet({ onDismiss }: GuestAuthSheetProps) {
  const insets = useSafeAreaInsets();
  const { startSSOFlow } = useSSO();
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleGoogle = useCallback(async () => {
    try {
      setSsoLoading(true);
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'aux',
        path: 'oauth-native-callback',
      });
      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });
      const { createdSessionId, setActive, signIn } = result;
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      } else if (signIn && signIn.status === 'complete') {
        await setActive!({ session: signIn.createdSessionId });
      }
    } catch {
      Alert.alert('Authentication Error', 'Something went wrong. Please try again.');
    } finally {
      setSsoLoading(false);
    }
  }, [startSSOFlow]);

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 70 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <Text style={styles.heading}>Sign in to AUX</Text>
        <Text style={styles.subheading}>
          Log in or sign up to unlock all features.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={ssoLoading}
            activeOpacity={0.8}
          >
            {ssoLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#000" />
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => router.push('/(auth)/selection?mode=signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logInBtn}
            onPress={() => router.push('/(auth)/selection?mode=signin')}
            activeOpacity={0.8}
          >
            <Text style={styles.logInText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    gap: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  subheading: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    marginBottom: 12,
  },
  buttons: {
    gap: 10,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 26,
    gap: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  signUpBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 50,
    borderRadius: 26,
  },
  signUpText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  logInBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 50,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logInText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
