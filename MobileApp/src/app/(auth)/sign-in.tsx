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
import { useHeaderHeight } from '@react-navigation/elements';
import Svg, { Circle } from 'react-native-svg';
import { Toast } from "@/components/Toast";

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

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SignInScreen() {
  const [step, setStep] = useState(1);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [errorToast, setErrorToast] = useState<{ message: string; code?: string; stepToNavigate?: number } | null>(null);

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

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(onboarding)/notifications");
      } else {
        setErrorToast({ message: "Sign in could not be completed", code: "STATUS_" + signInAttempt.status });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const error = err.errors[0];
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
        setErrorToast({ message: "Unknown error" });
      }
    }
  };

  const onSendMagicLink = async () => {
    if (!isLoaded || !email) return;

    try {
      const signInResult = await signIn.create({
        identifier: email,
      });

      const emailLinkFactor = signInResult.supportedFirstFactors?.find(
        (f: any) => f.strategy === "email_link"
      );

      if (emailLinkFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_link",
          emailAddressId: (emailLinkFactor as any).emailAddressId,
          redirectUrl: 'aux://post-auth', // This should match your deep link config
        });
        setIsMagicLinkSent(true);
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrorToast({ 
          message: err.errors[0]?.longMessage || "An error occurred", 
          code: err.errors[0]?.code 
        });
      }
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
              
              <SignInWith />
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
              <Pressable onPress={onSendMagicLink}>
                <Text style={styles.magicLinkText}>Sign in with Magic Link instead</Text>
              </Pressable>

              <Link href="/(auth)/sign-up" asChild>
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
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  forgotPassword: {
    color: "#A881E6",
    textAlign: "right",
    fontSize: 14,
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
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});