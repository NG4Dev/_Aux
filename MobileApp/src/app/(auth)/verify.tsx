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
<<<<<<< HEAD
import { Link } from "expo-router";
import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";

=======
import { Link, router, Stack } from "expo-router";
import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
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

const verifySchema = z.object({
  code: z.string({ message: "Code is required" }).length(6, 'Invalid code'),
});

type VerifyFields = z.infer<typeof verifySchema>;

const mapClerkErrorToFormField = (error: any) => {

  switch(error.meta?.paramName) {
    case 'code':
      return 'code';
    default:
      return 'root';
  }
};

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function VerifyScreen() {
  const {
    control,
    handleSubmit,
    setError,
<<<<<<< HEAD
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
  });

  const { signUp, isLoaded, setActive } = useSignUp(); 
=======
    formState: { errors, isValid },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
    mode: 'onChange',
  });

  const { signUp, isLoaded, setActive } = useSignUp(); 
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
>>>>>>> app-routing

  const onVerify = async ({code}: VerifyFields) => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ 
        code,
      });

      if (signUpAttempt.status === 'complete') {
<<<<<<< HEAD
        setActive({ session: signUpAttempt.createdSessionId });
=======
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(onboarding)/success");
>>>>>>> app-routing
      } else {
        console.log('Verification failed');
        console.log(signUpAttempt);
        setError('root', { message: 'Could not complete signing up' });
      }

    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        // Clear any existing errors first
        setError('root', { message: '' });
        setError('code', { message: '' });

        // Set new errors
        error.errors.forEach((err) => {
          const fieldName = mapClerkErrorToFormField(err);
          setError(fieldName, {
            message: err.longMessage,
          });
          
          // Log only the current error
          console.log('Errors:', JSON.stringify({
            [fieldName]: {
              message: err.longMessage
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
        <Text style={styles.title}>Verify your email</Text>
      </View>

      <View style={styles.form}>
        <CustomTextInput
          control={control}
          name="code"
          placeholder="123456"
          autoFocus
          autoCapitalize='none'
          keyboardType='number-pad'
          autoComplete='one-time-code'
        />
      </View>

      <CustomButton text="Verify" onPress={handleSubmit(onVerify)} />

      {/* <Link href="/(auth)/sign-in" style={styles.link}>
        Didn't receive the code? Press here to resend
      </Link> */}

    </ScrollView>
=======
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Verify',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          headerRight: () => (
            <View style={{ marginRight: 15 }}>
              <ProgressCircle progress={0.9} />
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
            <Text style={styles.label}>Verification Code</Text>
            <CustomTextInput
              control={control}
              name="code"
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={styles.helperText}>Enter the code we sent to your email.</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <CustomButton
            text="Verify"
            onPress={handleSubmit(onVerify)}
            style={[
              styles.verifyButton,
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
  form: {
    gap: 10,
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  // link: {
  //   color: "blue",
  //   fontWeight: "600",
  //   textAlign: "center",
  //   marginTop: 15,
  // },
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
  helperText: {
    color: "#A881E6",
    fontSize: 13,
  },
  footer: {
    padding: 20,
    backgroundColor: "#000",
  },
  verifyButton: {
    backgroundColor: "#1DB954",
    width: "100%",
  },
>>>>>>> app-routing
});
