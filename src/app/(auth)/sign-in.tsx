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
        <Ionicons name="arrow-back" size={24} color="#fff" onPress={() => router.back()} />
        <Text style={styles.title}>Sign in</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <CustomTextInput
          control={control}
          name="email"
          placeholder=""
          autoFocus
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Text style={styles.helperText}>This is the email from the root user, it will be used for any communications.</Text>

        <Text style={styles.label}>Password</Text>
        <CustomTextInput
          control={control}
          name="password"
          placeholder=""
          secureTextEntry
        />
        {/* TODO: Add password strength bar if needed, currently not in figma except for signup */}

        <Text style={styles.error}>{errors?.root?.message}</Text>
      </View>


      <CustomButton text="Sign In" onPress={handleSubmit(onSignIn)} style={styles.signInButton} />

      <Link href="/" asChild>
          <Text style={styles.passwordlessText}>Sign in without password</Text>
      </Link>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      <Link href="/(auth)/sign-up" style={styles.link}>
        Don't have an account? Sign up
      </Link>

      <CustomButton
        text="Sign In with Google"
        style={styles.googleButton}
        icon="logo-google"
        iconColor="#000"
        onPress={() => { /* TODO */ }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    gap: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#000",
    paddingVertical: 10,
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  helperText: {
    color: '#1D8954', // Green
    fontSize: 12,
    marginTop: 5,
  },
  error: {
    color: 'crimson',
    marginTop: 10,
  },
  form: {
    marginVertical: 10,
  },
  signInButton: {
    backgroundColor: '#1D8954', // Green
    width: '100%',
    borderRadius: 5, // Rectangular with slight radius
  },
  passwordlessText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  link: {
    color: "#fff", 
    fontWeight: "600",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    marginBottom: 20,
  }
});
