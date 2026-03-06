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
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";


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
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
  });

  const { signUp, isLoaded, setActive } = useSignUp(); 

  const onVerify = async ({code}: VerifyFields) => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ 
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(onboarding)/success");
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

      <Link href="/(auth)/sign-in" style={styles.link}>
        Didn't receive the code? Press here to resend
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
