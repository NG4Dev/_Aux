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
import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { isClerkAPIResponseError } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

const signUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.date({ required_error: "Date of birth is required" }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const {
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
        dob: new Date(),
    }
  });

  const { signUp, isLoaded, setActive } = useSignUp();
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  // Watch values for progressive validation
  const email = watch('email');
  const password = watch('password');
  const dob = watch('dob');
  const firstName = watch('firstName');
  const lastName = watch('lastName');

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.push("/(auth)/verify");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        console.error("Clerk Error:", err.errors);
        setError('root', { message: err.errors[0]?.longMessage || 'An error occurred' });
      }
    }
  };

  const handleNext = async () => {
    let isValid = false;
    // Clear previous errors first to avoid double error messages if multiple fields are invalid
    if (step === 1) isValid = await trigger('email');
    if (step === 2) isValid = await trigger('password');
    if (step === 3) isValid = true; 
    if (step === 4) isValid = await trigger(['firstName', 'lastName']);

    if (isValid) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleSubmit(onSignUp)();
      }
    }
  };

  const handleBack = () => {
      if (step > 1) {
          setStep(step - 1);
      } else {
          router.back();
      }
  }

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={24} color="#fff" onPress={handleBack} />
        <Text style={styles.title}>Create account</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Progress Bar (Optional - matched implicitly by steps) */}
      
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: keyboardPadding + 20 }]}
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
                <Text style={styles.helperText}>We will send you an email with a code, so you verify the account</Text>
                {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
            </View>
        )}

        {step === 2 && (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Create a password</Text>
                <CustomTextInput
                    control={control}
                    name="password"
                    placeholder=""
                    secureTextEntry
                    autoFocus
                    style={styles.input}
                />
                <View style={styles.passwordStrength}>
                    <View style={[styles.strengthBar, password?.length > 0 ? styles.activeBar : {}]} />
                    <View style={[styles.strengthBar, password?.length > 4 ? styles.activeBar : {}]} />
                    <View style={[styles.strengthBar, password?.length > 8 ? styles.activeBar : {}]} />
                    <View style={[styles.strengthBar, password?.length > 10 ? styles.activeBar : {}]} />
                </View>
                <Text style={styles.helperText}>Your password is exceptional and exceeds minimum standards</Text>
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
            </View>
        )}

        {step === 3 && (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>What's your date of birth?</Text>
                <View style={styles.datePickerContainer}>
                    <DateTimePicker
                        value={dob || new Date()}
                        mode="date"
                        display="spinner"
                        themeVariant="dark"
                        onChange={(event, selectedDate) => {
                            if (selectedDate) setValue('dob', selectedDate);
                        }}
                        style={{ height: 150 }}
                        textColor="#fff"
                    />
                </View>
            </View>
        )}

        {step === 4 && (
            <View style={styles.stepContainer}>
                <Text style={styles.label}>First Name</Text>
                <CustomTextInput
                    control={control}
                    name="firstName"
                    placeholder=""
                    style={styles.input}
                />
                <Text style={styles.fieldHelper}>Insert your first name in the input field above.</Text>

                <Text style={styles.label}>Last Name</Text>
                <CustomTextInput
                    control={control}
                    name="lastName"
                    placeholder=""
                    style={styles.input}
                />
                <Text style={styles.fieldHelper}>Insert your last name in the input field above.</Text>

                <View style={styles.termsContainer}>
                    <View style={styles.checkbox} />
                    <Text style={styles.termsText}>
                        I agree with [Insert Company Name] Terms of Service, Payments Terms of Service & Privacy Policy
                    </Text>
                </View>
            </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
          <CustomButton 
            text={step === 4 ? "Create Account" : "Next"} 
            onPress={handleNext}
            style={styles.nextButton}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
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
    backgroundColor: '#333',
    borderColor: 'transparent',
    color: '#fff',
    padding: 15,
    borderRadius: 5,
  },
  helperText: {
    color: '#A881E6', // Purple accent
    fontSize: 12,
  },
  fieldHelper: {
      color: '#1D8954', // Green accent
      fontSize: 10,
      marginBottom: 15,
  },
  label: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 5,
  },
  error: {
    color: 'crimson',
    fontSize: 12,
  },
  footer: {
      padding: 20,
      paddingBottom: 40,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#000', // Ensure background covers content when scrolling
  },
  nextButton: {
      backgroundColor: '#1D8954', // Green
      borderRadius: 3,
      width: '100%',
  },
  // Step 2 specifics
  passwordStrength: {
      flexDirection: 'row',
      gap: 5,
      marginTop: 10,
  },
  strengthBar: {
      flex: 1,
      height: 4,
      backgroundColor: '#333',
      borderRadius: 2,
  },
  activeBar: {
      backgroundColor: '#1D8954',
  },
  // Step 3 specifics
  datePickerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
  },
  // Step 4 specifics
  termsContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
      paddingRight: 20,
  },
  checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: '#fff',
      borderRadius: 10, // Circle
  },
  termsText: {
      color: '#fff',
      fontSize: 10,
      lineHeight: 14,
  },
});
