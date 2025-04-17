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
import { Link } from "expo-router";
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
    formState: { errors},
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
  });

  
  const { signIn, isLoaded, setActive } = useSignIn();
  
  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        setActive({ session: signInAttempt.createdSessionId });
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

  const [keyboardPadding, setKeyboardPadding] = useState(0);

  useEffect(() => {
    const onKeyboardShow = (event: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardPadding(event.endCoordinates.height);
    };
    const onKeyboardHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardPadding(0);
    };

    const showSub = Keyboard.addListener("keyboardDidShow", onKeyboardShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: keyboardPadding + 20 },
      ]}
      keyboardShouldPersistTaps="handled"
      stickyHeaderIndices={[0]}
      scrollEnabled={false}
    >
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sign in</Text>
      </View>

      <View style={styles.form}>
        <CustomTextInput
          control={control}
          name="email"
          placeholder="Email"
          autoFocus
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <CustomTextInput
          control={control}
          name="password"
          placeholder="Password"
          secureTextEntry
        />

        <Text style={styles.error}>{errors?.root?.message}</Text>
      </View>


      <CustomButton text="Sign in" onPress={handleSubmit(onSignIn)} />

      <Link href="/(auth)/sign-up" style={styles.link}>
        Don't have an account? Sign up
      </Link>

      <SignInWith />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 10,
    gap: 15,
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomColor: "#ccc",
  },
  error: {
    color: 'crimson',
  },
  form: {
    gap: 10,
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  link: {
    color: "blue",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 15,
  }
});
