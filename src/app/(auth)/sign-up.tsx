import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
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
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getDaysInMonth = (monthIndex: number, year: number) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const WheelColumn = ({
  data,
  selectedIndex,
  onSelect,
}: {
  data: Array<string | number>;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) => {
  const listRef = useRef<FlatList<any>>(null);
  const isMounted = useRef(false);
  const lastReportedIndex = useRef(selectedIndex);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (!listRef.current || data.length === 0) return;
    const safeIndex = clamp(selectedIndex, 0, data.length - 1);

    if (!isMounted.current) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: safeIndex * ITEM_HEIGHT, animated: false });
      }, 0);
      isMounted.current = true;
    } else if (selectedIndex !== lastReportedIndex.current && !isScrolling.current) {
      // Only scroll programmatically if the change came from outside (e.g., clamping days)
      listRef.current?.scrollToOffset({ offset: safeIndex * ITEM_HEIGHT, animated: true });
      lastReportedIndex.current = safeIndex;
    }
  }, [selectedIndex, data.length]);

  const snapOffsets = useMemo(() => data.map((_, i) => i * ITEM_HEIGHT), [data]);

  const handleScrollEnd = useCallback(
    (event: any) => {
      isScrolling.current = false;
      const y = event.nativeEvent.contentOffset.y;
      const index = clamp(Math.round(y / ITEM_HEIGHT), 0, data.length - 1);
      
      // Force an exact offset snap. Sometimes Android resting positions are slightly off.
      listRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });

      if (index !== lastReportedIndex.current) {
        lastReportedIndex.current = index;
        onSelect(index);
      }
    },
    [data.length, onSelect]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string | number; index: number }) => (
      <View key={`item-${index}-${item}`} style={styles.wheelItem}>
        <Text 
          style={[styles.wheelText, index === selectedIndex && styles.wheelTextSelected]}
          allowFontScaling={false}
        >
          {item}
        </Text>
      </View>
    ),
    [selectedIndex]
  );

  return (
    <View style={styles.wheelColumn}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        showsVerticalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        snapToAlignment="start"
        onScrollBeginDrag={() => { isScrolling.current = true; }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          // If the user drags and releases very slowly, momentum might not trigger
          if (e.nativeEvent.velocity && Math.abs(e.nativeEvent.velocity.y) < 0.1) {
            handleScrollEnd(e);
          }
        }}
        contentContainerStyle={{ paddingVertical: (LIST_HEIGHT - ITEM_HEIGHT) / 2 }}
        style={{ height: LIST_HEIGHT }}
      />

      <View style={styles.selectionOverlay} pointerEvents="none">
        <View style={[styles.selectionLine, { top: (LIST_HEIGHT - ITEM_HEIGHT) / 2 }]} />
        <View style={[styles.selectionLine, { top: (LIST_HEIGHT + ITEM_HEIGHT) / 2 }]} />
      </View>
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
  
  const dob = watch('dob') || new Date();
  const currentYear = dob.getFullYear();
  const currentMonth = dob.getMonth();
  const currentDay = dob.getDate();

  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth, currentYear), [currentMonth, currentYear]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const updateDate = useCallback((type: 'day' | 'month' | 'year', value: number) => {
    const newDate = new Date(dob);
    if (type === 'day') {
      newDate.setDate(Math.min(value, daysInMonth));
    }
    if (type === 'month') {
      newDate.setMonth(value);
      const lastDay = getDaysInMonth(value, newDate.getFullYear());
      if (newDate.getDate() > lastDay) newDate.setDate(lastDay);
    }
    if (type === 'year') {
      newDate.setFullYear(value);
      const lastDay = getDaysInMonth(newDate.getMonth(), value);
      if (newDate.getDate() > lastDay) newDate.setDate(lastDay);
    }
    setValue('dob', newDate, { shouldValidate: true });
  }, [dob, daysInMonth, setValue]);

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
          {step === 3 ? (
          <View style={[styles.contentContainer, { flex: 1 }]}>
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>What's your date of birth?</Text>
                
                <View style={styles.wheelContainer}>
                  <View style={styles.wheelBackground} />
                  <WheelColumn
                    data={months}
                    selectedIndex={currentMonth}
                    onSelect={(idx) => updateDate('month', idx)}
                  />
                  <WheelColumn
                    data={daysArray}
                    selectedIndex={Math.min(currentDay - 1, daysInMonth - 1)}
                    onSelect={(idx) => updateDate('day', idx + 1)}
                  />
                  <WheelColumn
                    data={years}
                    selectedIndex={years.indexOf(currentYear)}
                    onSelect={(idx) => updateDate('year', years[idx])}
                  />
                </View>

            </View>
          </View>
        ) : (
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
        )}

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
    height: 260, // LIST_HEIGHT
    marginTop: 40,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  wheelBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  wheelItem: {
    height: 52, // ITEM_HEIGHT
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 52,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  wheelTextSelected: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 52,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 260, // LIST_HEIGHT
  },
  selectionLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
