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
  KeyboardAvoidingView,
  BackHandler,
} from "react-native";
import CustomTextInput from "@/components/CustomTextInput";
import CustomButton from "@/components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, Stack, useNavigation } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { isClerkAPIResponseError } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import Svg, { Circle } from "react-native-svg";

const signUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.date({ required_error: "Date of birth is required" }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type SignUpFields = z.infer<typeof signUpSchema>;

const ProgressCircle = ({ step }: { step: number }) => {
  const size = 24; // Smaller to match Figma
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = step / 4;
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

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();

  // Intercept system back gestures (iOS swipe & Android back)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (step > 1) {
        e.preventDefault();
        setStep(prev => prev - 1);
      }
    });
    return unsubscribe;
  }, [navigation, step]);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
        dob: new Date(),
    }
  });

  const { signUp, isLoaded, setActive } = useSignUp();

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
        unsafeMetadata: {
          firstName: data.firstName,
          lastName: data.lastName,
          dob: data.dob.toISOString(),
        }
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
    Keyboard.dismiss();
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

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      router.back();
    }
  }, [step]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const CustomWheelPicker = () => {
    const currentYear = dob.getFullYear();
    const currentMonth = dob.getMonth();
    const currentDay = dob.getDate();

    const updateDate = (type: 'day' | 'month' | 'year', value: number) => {
      const newDate = new Date(dob);
      if (type === 'day') {
        const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
        newDate.setDate(Math.min(value, lastDay));
      }
      if (type === 'month') {
        newDate.setMonth(value);
        const lastDay = new Date(newDate.getFullYear(), value + 1, 0).getDate();
        if (newDate.getDate() > lastDay) newDate.setDate(lastDay);
      }
      if (type === 'year') newDate.setFullYear(value);
      setValue('dob', newDate, { shouldValidate: true });
    };

    const WheelColumn = ({ 
      data, 
      currentValue, 
      type,
      isMonth = false 
    }: { 
      data: (string | number)[], 
      currentValue: number, 
      type: 'day' | 'month' | 'year',
      isMonth?: boolean
    }) => {
      const scrollViewRef = useRef<ScrollView>(null);
      const ITEM_HEIGHT = 50; // Increased for better readability

      useEffect(() => {
        const index = isMonth ? currentValue : data.indexOf(currentValue);
        if (index !== -1) {
          // Use a slight delay to ensure the layout is ready and prevent glitchy snaps
          const timer = setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
          }, 10);
          return () => clearTimeout(timer);
        }
      }, [currentValue]); // Respond to external changes (validation snaps)

      return (
        <View style={styles.wheelColumn}>
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false} 
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }} 
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
              const val = isMonth ? index : Number(data[index]);
              if (data[index] !== undefined && val !== currentValue) {
                updateDate(type, val);
              }
            }}
          >
            {data.map((item, i) => {
              const val = isMonth ? i : item;
              const isActive = currentValue === val;
              return (
                <View key={`${type}-${item}`} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
                  <Text style={[
                    styles.wheelText, 
                    isActive && styles.activeWheelText,
                    !isActive && { opacity: 0.25 }
                  ]}>
                    {item}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
          {/* Individual column dividers to match Figma */}
          <View style={styles.columnDividerContainer} pointerEvents="none">
            <View style={styles.columnDivider} />
            <View style={styles.columnDivider} />
          </View>
        </View>
      );
    };

    return (
      <View style={styles.wheelContainer}>
        <View style={styles.wheelBackground} />
        <WheelColumn data={days} currentValue={currentDay} type="day" />
        <WheelColumn data={months} currentValue={currentMonth} type="month" isMonth />
        <WheelColumn data={years} currentValue={currentYear} type="year" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Create account',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          gestureEnabled: step === 1, // Disable swipe back gesture during flow
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
          automaticallyAdjustContentInsets={false}
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
              </View>
          )}

          {step === 3 && (
              <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>What's your date of birth?</Text>
                  <CustomWheelPicker />
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

                  <Pressable 
                    onPress={() => setAgreedToTerms(prev => !prev)}
                    style={styles.termsContainer}
                    hitSlop={20}
                  >
                    <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                      {agreedToTerms && <Ionicons name="checkmark" size={16} color="#000" />}
                    </View>
                    <Text style={styles.termsText}>
                        I agree with [Insert Company Name] Terms of Service, Payments Terms of Service & Privacy Policy
                    </Text>
                  </Pressable>
              </View>
          )}
        </ScrollView>

        <View style={[
          styles.footer,
          keyboardHeight > 0 && { paddingBottom: 10 } // Tighter padding when keyboard is up
        ]}>
            <CustomButton 
              text={step === 4 ? "Create Account" : "Next"} 
              onPress={handleNext}
              style={[
                styles.nextButton,
                { 
                  opacity: (
                    (step === 1 && email && !errors.email) ||
                    (step === 2 && password && !errors.password) ||
                    (step === 3) ||
                    (step === 4 && firstName && lastName && !errors.firstName && !errors.lastName && agreedToTerms)
                  ) ? 1 : 0.5 
                }
              ]}
              disabled={
                !(
                  (step === 1 && email && !errors.email) ||
                  (step === 2 && password && !errors.password) ||
                  (step === 3) ||
                  (step === 4 && firstName && lastName && !errors.firstName && !errors.lastName && agreedToTerms)
                )
              }
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
    backgroundColor: '#2A2A2A', // Darker gray for input
    borderColor: 'transparent',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  helperText: {
    color: '#9D7BFF', // Brighter purple
    fontSize: 13,
    marginTop: 8,
  },
  fieldHelper: {
      color: '#1DB954', // Match the splash screen green
      fontSize: 11,
      marginBottom: 20,
      marginTop: 4,
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
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: '#000',
  },
  nextButton: {
      backgroundColor: '#1DB954', // Spotify Green
      width: '100%',
  },
  // Step 2 specifics
  passwordStrength: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 12,
  },
  strengthBar: {
      flex: 1,
      height: 8,
      backgroundColor: '#333',
      borderRadius: 4,
  },
  activeBar: {
      backgroundColor: '#1DB954', // Match the splash screen green
  },
  // Step 3 specifics
  wheelContainer: {
    flexDirection: 'row',
    height: 250,
    marginTop: 40,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  wheelBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  wheelColumn: {
    flex: 1,
    position: 'relative',
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '400',
  },
  activeWheelText: {
    color: '#fff',
    fontSize: 26, // Increased for focus
    fontWeight: '700',
  },
  columnDividerContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -25, // Half of ITEM_HEIGHT
    left: 15,
    right: 15,
    height: 50, // Matches ITEM_HEIGHT
    justifyContent: 'space-between',
  },
  columnDivider: {
    height: 2, // Slightly bolder for clarity
    backgroundColor: '#fff',
    width: '100%',
  },
  // Step 4 specifics
  termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 24,
      paddingRight: 10,
      minHeight: 44, // Ensure good tap target
  },
  checkbox: {
      width: 28,
      height: 28,
      borderWidth: 2,
      borderColor: '#555',
      borderRadius: 14, // Circle
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1A1A1A',
  },
  checkboxActive: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  termsText: {
      color: '#fff',
      fontSize: 12,
      lineHeight: 18,
      flex: 1,
  },
});
