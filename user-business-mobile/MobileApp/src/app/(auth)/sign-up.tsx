import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  Platform,
  Keyboard,
  Pressable,
  BackHandler,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomTextInput from "@/components/CustomTextInput";
import CustomButton from "@/components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, Stack } from "expo-router";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { isClerkAPIResponseError } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { Toast } from "@/components/Toast";
import DateOfBirthPicker, { DEFAULT_DOB } from "@/components/onboarding/DateOfBirthPicker";
import { authLog } from "@/services/authFlowLogger";
import { useAuthKeyboardHeight } from "@/hooks/useAuthKeyboardHeight";
import { useStepBackGesture } from "@/hooks/useStepBackGesture";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_LIST = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

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

const ITEM_HEIGHT = 64;
const VISIBLE_ITEMS = 5;
const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getDaysInMonth = (monthIndex: number, year: number) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const WheelItem = React.memo(({ 
  item, 
  index, 
  scrollY 
}: { 
  item: string | number; 
  index: number; 
  scrollY: Animated.Value 
}) => {
  const opacity = scrollY.interpolate({
    inputRange: [
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
    ],
    outputRange: [0.1, 0.4, 1, 0.4, 0.1],
    extrapolate: 'clamp',
  });

  const scale = scrollY.interpolate({
    inputRange: [
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
    ],
    outputRange: [0.85, 1.1, 0.85],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wheelItem}>
      <Animated.Text 
        style={[
          styles.wheelText, 
          { opacity, transform: [{ scale }] }
        ]}
        allowFontScaling={false}
      >
        {item}
      </Animated.Text>
    </View>
  );
});

const WheelColumn = React.memo(({
  data,
  selectedIndex,
  onSelect,
}: {
  data: Array<string | number>;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) => {
  const listRef = useRef<FlatList<any>>(null);
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;
  const isUserInteracting = useRef(false);
  const currentSelection = useRef(selectedIndex);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!listRef.current || data.length === 0) return;
    const safeIndex = clamp(selectedIndex, 0, data.length - 1);

    const performSync = (animated = true) => {
      if (!listRef.current) return;
      currentSelection.current = safeIndex;
      listRef.current.scrollToOffset({ 
        offset: safeIndex * ITEM_HEIGHT, 
        animated
      });
      scrollY.setValue(safeIndex * ITEM_HEIGHT);
    };

    if (!isMounted.current) {
      const timer = setTimeout(() => {
        performSync(false);
        isMounted.current = true;
      }, 150);
      return () => clearTimeout(timer);
    } else if (!isUserInteracting.current && safeIndex !== currentSelection.current) {
      performSync(true);
    }
  }, [selectedIndex, data.length]);

  const handleScrollEnd = useCallback(
    (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = clamp(Math.round(y / ITEM_HEIGHT), 0, data.length - 1);
      const targetOffset = index * ITEM_HEIGHT;
      
      if (Math.abs(y - targetOffset) > 0.5) {
        listRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
      }

      if (index !== currentSelection.current) {
        currentSelection.current = index;
        onSelect(index);
      }
      
      isUserInteracting.current = false;
    },
    [data.length, onSelect]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string | number; index: number }) => (
      <WheelItem item={item} index={index} scrollY={scrollY} />
    ),
    [data]
  );

  return (
    <View style={styles.wheelColumn}>
      <Animated.FlatList
        ref={listRef as any}
        data={data}
        keyExtractor={(item, index) => `wheel-${item}-${index}`}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        showsVerticalScrollIndicator={false} 
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onScrollBeginDrag={() => { isUserInteracting.current = true; }}
        onMomentumScrollBegin={() => { isUserInteracting.current = true; }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          const velocity = e.nativeEvent.velocity?.y || 0;
          if (Math.abs(velocity) < 0.1) {
            handleScrollEnd(e);
          }
        }}
        contentContainerStyle={{ paddingVertical: (LIST_HEIGHT - ITEM_HEIGHT) / 2 }}
        style={{ height: LIST_HEIGHT }}
        initialNumToRender={data.length}
        maxToRenderPerBatch={data.length}
        windowSize={5}
        removeClippedSubviews={false}
      />

      <View style={styles.selectionOverlay} pointerEvents="none">
        <View style={[styles.selectionLine, { top: (LIST_HEIGHT - ITEM_HEIGHT) / 2 }]} />
        <View style={[styles.selectionLine, { top: (LIST_HEIGHT + ITEM_HEIGHT) / 2 }]} />
        
        <LinearGradient
          colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
          style={[styles.gradientOverlay, { top: 0, height: (LIST_HEIGHT - ITEM_HEIGHT) / 2 }]}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,1)']}
          style={[styles.gradientOverlay, { bottom: 0, height: (LIST_HEIGHT - ITEM_HEIGHT) / 2 }]}
        />
      </View>
    </View>
  );
});

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const keyboardHeight = useAuthKeyboardHeight();
  const { gestureEnabled } = useStepBackGesture(step, setStep);
  const [errorToast, setErrorToast] = useState<{ message: string; code?: string; stepToNavigate?: number } | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      dob: DEFAULT_DOB,
    }
  });

  const { signUp, isLoaded, setActive } = useSignUp();

  const email = watch('email');
  const password = watch('password');
  const firstName = watch('firstName');
  const lastName = watch('lastName');

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    authLog('signUp', 'start', { email: data.email, hasDob: !!data.dob });

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

      authLog('signUp', 'created', { status: signUp.status });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      authLog('signUp', 'navigate', { to: '/(auth)/verify' });
      router.push("/(auth)/verify");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const error = err.errors[0];
        authLog('signUp', 'clerkError', { code: error.code, message: error.longMessage });
        let stepToNavigate = undefined;
        if (error.meta?.paramName === 'email_address') stepToNavigate = 1;
        else if (error.meta?.paramName === 'password') stepToNavigate = 2;
        else if (error.meta?.paramName === 'first_name' || error.meta?.paramName === 'last_name') stepToNavigate = 4;

        setErrorToast({ 
          message: error.longMessage || "An error occurred", 
          code: error.code,
          stepToNavigate 
        });
      }
    }
  };

  const handleNext = async () => {
    Keyboard.dismiss();
    let isValid = false;
    if (step === 1) isValid = await trigger('email');
    if (step === 2) isValid = await trigger('password');
    if (step === 3) isValid = await trigger('dob');
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

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      title: 'Create account',
      headerTitleAlign: 'center' as const,
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff',
      headerShadowVisible: false,
      gestureEnabled,
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
    }),
    [gestureEnabled, handleBack, step],
  );

  const dob = watch('dob') || new Date();
  const currentYear = dob.getFullYear();
  const currentMonth = dob.getMonth();
  const currentDay = dob.getDate();

  const monthList = useMemo(() => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], []);
  const yearList = useMemo(() => Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i), []);
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth, currentYear), [currentMonth, currentYear]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const updateDate = useCallback((type: 'day' | 'month' | 'year', value: number) => {
    const currentDob = getValues('dob') || new Date();
    let year = currentDob.getFullYear();
    let month = currentDob.getMonth();
    let day = currentDob.getDate();

    if (type === 'day') day = value;
    else if (type === 'month') month = value;
    else if (type === 'year') year = value;

    const lastDay = getDaysInMonth(month, year);
    if (day > lastDay) day = lastDay;

    const newDate = new Date(year, month, day);
    setValue('dob', newDate, { shouldValidate: true });
  }, [getValues, setValue]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={screenOptions} />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        {step === 3 ? (
          <View style={[styles.contentContainer, { flex: 1 }]}>
            <DateOfBirthPicker
              value={dob}
              onChange={(date) => setValue('dob', date, { shouldValidate: true })}
            />
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
          keyboardHeight > 0 && { paddingBottom: 10 }
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

      {errorToast && (
        <Toast
          message={errorToast.message}
          code={errorToast.code}
          onAction={errorToast.stepToNavigate ? () => {
            setStep(errorToast.stepToNavigate!);
            setErrorToast(null);
          } : undefined}
          actionText={errorToast.stepToNavigate ? `Go to Page` : undefined}
          onHide={() => setErrorToast(null)}
        />
      )}
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
    backgroundColor: '#2A2A2A',
    borderColor: 'transparent',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  helperText: {
    color: '#9D7BFF',
    fontSize: 13,
    marginTop: 8,
  },
  fieldHelper: {
    color: '#1DB954',
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  nextButton: {
    backgroundColor: '#1DB954',
    width: '100%',
  },
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
    backgroundColor: '#1DB954',
  },
  wheelContainer: {
    flexDirection: 'row',
    height: LIST_HEIGHT,
    marginTop: 40,
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wheelBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 4,
  },
  wheelColumnDivider: {
    width: 1,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  wheelText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    height: ITEM_HEIGHT,
    lineHeight: ITEM_HEIGHT,
    paddingHorizontal: 12,
    overflow: 'visible',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LIST_HEIGHT,
  },
  selectionLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    paddingRight: 10,
    minHeight: 44,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 14,
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