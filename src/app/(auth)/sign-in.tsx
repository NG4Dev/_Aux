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
  Alert,
} from "react-native";
import CustomTextInput from "@/components/CustomTextInput";
import CustomButton from "@/components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import SignInWith from "@/components/SignInWith";

const signInSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password should be at least 8 characters long"),
});

type SignInFields = z.infer<typeof signInSchema>;

const mapClerkErrorToFormField = (error: any) => {

  switch(error.meta?.paramName) {
    case 'identifier':
      return'email';
    case 'password':
      return 'password';
    default:
      return 'root';
  }
};

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SignInScreen() {
  const { 
    control, 
    handleSubmit, 
    setError,
    formState: { errors, isValid },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  });

  
  const { signIn, isLoaded, setActive } = useSignIn();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(onboarding)/success");
      } else {
        console.log("Sign in failed");
        setError('root', { message: 'Sign in could not be completed' });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        // Clear any existing errors first
        setError('root', { message: '' });
        setError('email', { message: '' });
        setError('password', { message: '' });

        // Set new errors
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error);
          setError(fieldName, {
            message: error.longMessage,
          });
          
          // Log only the current error
          console.log('Errors:', JSON.stringify({
            [fieldName]: {
              message: error.longMessage
            }
          }, null, 2));
        });

      } else {
        setError('root', { message: 'Unknown error' });
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
          headerBackTitleVisible: false,
        }} 
      />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <CustomTextInput
              control={control}
              name="email"
              placeholder="Enter your email"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <CustomTextInput
              control={control}
              name="password"
              placeholder="Enter your password"
              secureTextEntry
            />

            <Link href="/(auth)/sign-up" asChild>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </Link>
          </View>

          <SignInWith />
        </ScrollView>

        <View style={styles.footer}>
          <CustomButton
            text="Sign in"
            onPress={handleSubmit(onSignIn)}
            style={[
              styles.signInButton,
              { opacity: isValid ? 1 : 0.5 }
            ]}
            disabled={!isValid}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  form: {
    gap: 15,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  forgotPassword: {
    color: "#A881E6",
    textAlign: "right",
    fontSize: 14,
  },
  footer: {
    padding: 20,
    backgroundColor: "#000",
  },
  signInButton: {
    backgroundColor: "#A881E6",
    width: "100%",
  },
});
