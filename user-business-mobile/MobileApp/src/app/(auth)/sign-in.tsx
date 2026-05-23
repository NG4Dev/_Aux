import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Pressable,
} from "react-native";
import CustomTextInput from "@/components/CustomTextInput";
import CustomButton from "@/components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, Stack } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import SignInWith from "@/components/SignInWith";
import { useHeaderHeight } from 'expo-router/react-navigation';
import Svg, { Circle } from 'react-native-svg';
import { Toast } from "@/components/Toast";
import { authLog } from "@/services/authFlowLogger";

const ProgressCircle = ({ step }: { step: number }) => {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = step / 2;
  const offset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#222"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1DB954"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const signInSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string()
    .min(8, "Password should be at least 8 characters long")
    .optional(),
});

type SignInFields = z.infer<typeof signInSchema>;

// LayoutAnimation is enabled by default in the New Architecture,
// so we don't need to call setLayoutAnimationEnabledExperimental anymore.

export default function SignInScreen() {
  const [step, setStep] = useState(1);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<{ message: string; code?: string; stepToNavigate?: number } | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const { 
    control, 
    handleSubmit, 
    setError,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  });

  const { signIn, isLoaded, setActive } = useSignIn();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const email = watch('email');
  const password = watch('password');

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleNext = async () => {
    Keyboard.dismiss();
    if (step === 1) {
      const isEmailValid = await trigger('email');
      if (isEmailValid) {
        setStep(2);
      }
    } else {
      handleSubmit(onSignIn)();
    }
  };

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      router.back();
    }
  }, [step]);

  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return;

    authLog('signIn', 'start', { email: data.email });

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      authLog('signIn', 'clerkStatus', { status: signInAttempt.status });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        authLog('signIn', 'navigate', { to: '/(auth)/post-auth' });
        router.replace("/(auth)/post-auth");
      } else {
        authLog('signIn', 'incomplete', { status: signInAttempt.status });
        setErrorToast({ message: "Sign in could not be completed", code: "STATUS_" + signInAttempt.status });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const error = err.errors[0];
        authLog('signIn', 'clerkError', { code: error.code, message: error.longMessage });
        // Map common errors to steps
        let stepToNavigate = undefined;
        if (error.code === 'form_identifier_not_found' || error.meta?.paramName === 'identifier') {
          stepToNavigate = 1;
        } else if (error.code === 'form_password_incorrect' || error.meta?.paramName === 'password') {
          stepToNavigate = 2;
        }

        setErrorToast({ 
          message: error.longMessage || "An error occurred", 
          code: error.code,
          stepToNavigate 
        });
      } else {
        authLog('signIn', 'error', { message: 'unknown' });
        setErrorToast({ message: "Unknown error" });
      }
    }
  };

  const onSendMagicLink = async () => {
    if (!isLoaded || !email) return;

    try {
      setIsMagicLinkLoading(true);
      console.log('Starting magic link flow for:', email);
      
      const signInResult = await signIn.create({
        identifier: email,
      });

      console.log('Sign in created, supported factors:', JSON.stringify(signInResult.supportedFirstFactors));

      const emailLinkFactor = signInResult.supportedFirstFactors?.find(
        (f: any) => f.strategy === "email_link"
      );

      if (emailLinkFactor) {
        console.log('Sending email link to factor:', (emailLinkFactor as any).emailAddressId);
        await signIn.prepareFirstFactor({
          strategy: "email_link",
          emailAddressId: (emailLinkFactor as any).emailAddressId,
          // Use Auth.post-auth to correctly map inside the Expo Router scheme
          redirectUrl: 'aux://post-auth', 
        });
        console.log('Magic link prepared and sent successfully');
        setIsMagicLinkSent(true);
      } else {
        console.warn('No email_link strategy found for this user');
        setErrorToast({
          message: "Email link sign-in is not enabled for your account.",
        });
      }
    } catch (err: any) {
      console.error('Magic link error:', JSON.stringify(err, null, 2));
      if (isClerkAPIResponseError(err)) {
        setErrorToast({ 
          message: err.errors[0]?.longMessage || "An error occurred", 
          code: err.errors[0]?.code 
        });
      } else {
        setErrorToast({ message: "An unexpected error occurred." });
      }
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Sign in',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={handleBack} style={{ padding: 12 }}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ marginRight: 15 }}>
              <ProgressCircle step={step} />
            </View>
          ),
        }} 
      />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter your email address</Text>
              <CustomTextInput
                control={control}
                name="email"
                placeholder=""
                autoFocus
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <Text style={styles.helperText}>We will send you an email with a link, so you verify the account</Text>
              <View style={styles.signInWithContainer}>
                <SignInWith onNewUser={() => setInfoToast("Signing you up…")} />
              </View>
            </View>
          )}

          {step === 2 && !isMagicLinkSent && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter your password</Text>
              <CustomTextInput
                control={control}
                name="password"
                placeholder=""
                secureTextEntry
                autoFocus
                style={styles.input}
              />
              <Pressable onPress={onSendMagicLink} disabled={isMagicLinkLoading}>
                <Text style={[styles.magicLinkText, isMagicLinkLoading && { opacity: 0.5 }]}>
                  {isMagicLinkLoading ? "Sending link..." : "Sign in with Magic Link instead"}
                </Text>
              </Pressable>

              <Link href="/(auth)/reset-password" asChild>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </Link>
            </View>
          )}

          {isMagicLinkSent && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Check your email</Text>
              <Text style={styles.helperText}>A magic link has been sent to {email}. Please click the link to sign in.</Text>
              <Pressable onPress={() => setIsMagicLinkSent(false)}>
                <Text style={styles.magicLinkText}>Back to password</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        <View style={[
          styles.footer,
          keyboardHeight > 0 && { paddingBottom: 10 }
        ]}>
          {!isMagicLinkSent && (
            <CustomButton
              text={step === 1 ? "Next" : "Sign in"}
              onPress={handleNext}
              style={[
                styles.nextButton,
                { opacity: (step === 1 ? (email && !errors.email) : (password && !errors.password)) ? 1 : 0.5 }
              ]}
              disabled={step === 1 ? !(email && !errors.email) : !(password && !errors.password)}
            />
          )}
        </View>
      </View>

      {infoToast && (
        <Toast
          message={infoToast}
          onHide={() => setInfoToast(null)}
          duration={3000}
        />
      )}

      {errorToast && (
        <Toast
          message={errorToast.message}
          code={errorToast.code}
          onAction={errorToast.stepToNavigate ? () => {
            setStep(errorToast.stepToNavigate!);
            setErrorToast(null);
          } : undefined}
          actionText={errorToast.stepToNavigate ? `Go to Page` : undefined}
          onHide={() => setErrorToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    gap: 15,
    marginTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderColor: 'transparent',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  helperText: {
    color: '#9D7BFF',
    fontSize: 13,
    marginTop: 8,
  },
  magicLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
  forgotPassword: {
    color: "#A881E6",
    textAlign: "right",
    fontSize: 14,
    marginTop: 20,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  nextButton: {
    backgroundColor: '#1DB954',
    width: "100%",
  },
  signInWithContainer: {
    marginTop: 40,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});