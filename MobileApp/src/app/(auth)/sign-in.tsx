<<<<<<< HEAD
=======
import { Ionicons } from "@expo/vector-icons";
>>>>>>> app-routing
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
<<<<<<< HEAD
import { Link } from "expo-router";
import { useState, useEffect } from "react";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import SignInWith from "@/components/SignInWith";
=======
import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import SignInWith from "@/components/SignInWith";
import { useHeaderHeight } from '@react-navigation/elements';
import Svg, { Circle } from 'react-native-svg';

const ProgressCircle = ({ progress }: { progress: number }) => {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
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
>>>>>>> app-routing

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
<<<<<<< HEAD
    formState: { errors},
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
=======
    formState: { errors, isValid },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
>>>>>>> app-routing
  });

  
  const { signIn, isLoaded, setActive } = useSignIn();
<<<<<<< HEAD
  
=======
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const headerHeight = useHeaderHeight();

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

>>>>>>> app-routing
  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
<<<<<<< HEAD
        setActive({ session: signInAttempt.createdSessionId });
=======
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(onboarding)/success");
>>>>>>> app-routing
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

<<<<<<< HEAD
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
=======
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
          headerRight: () => (
            <View style={{ marginRight: 15 }}>
              <ProgressCircle progress={1} />
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
>>>>>>> app-routing
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
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
>>>>>>> app-routing
});
