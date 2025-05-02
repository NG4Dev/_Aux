import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from "react-native";
import CustomTextInput from "@/components/CustomTextInput";
import CustomButton from "@/components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { isClerkAPIResponseError } from "@clerk/clerk-expo";

const signUpSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password should be at least 8 characters long"),
});

type SignUpFields = z.infer<typeof signUpSchema>;

const mapClerkErrorToFormField = (error: any) => {

  switch(error.meta?.paramName) {
    case 'email_address':
      return'email';
    case 'password':
      return 'password';
    default:
      return 'root';
  }
};

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SignUpScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  });

  const { signUp, isLoaded } = useSignUp(); 

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      // Create the user
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      // Prepare the verification (this triggers the email)
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      router.push('/(auth)/verify');
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

    const showSub = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: keyboardPadding + 20 }]}
      keyboardShouldPersistTaps="handled"
      stickyHeaderIndices={[0]}
      scrollEnabled={false} 
    >
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create an account</Text>
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

      <CustomButton text="Create account" onPress={handleSubmit(onSignUp)} />

      <Link href="/(auth)/sign-in" style={styles.link}>
        Already have an account? Sign in
      </Link>

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
  form: {
    gap: 10,
    marginVertical: 20,
  },
  error: {
    color: 'crimson',
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
  },
});
