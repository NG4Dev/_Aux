import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Keyboard,
  Platform,
  LayoutAnimation,
  UIManager,
  ScrollView,
  Pressable,
} from "react-native";
import { router, Stack } from "expo-router";
import CustomTextInput from "@/components/CustomTextInput";
import CustomButton from "@/components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Toast } from "@/components/Toast";

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type PasswordFields = z.infer<typeof passwordSchema>;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ResetPasswordScreen() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { user, isLoaded: isUserLoaded } = useUser();
  const [errorToast, setErrorToast] = useState<{ message: string; code?: string } | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const password = watch("password");

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
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

  const onReset = async (data: PasswordFields) => {
    if (!isUserLoaded || !user) return;

    try {
      await (user as any).updatePassword({
        newPassword: data.password,
      });
      router.replace("/(onboarding)/notifications");
    } catch (err: any) {
      setErrorToast({ 
        message: err.errors?.[0]?.longMessage || "Failed to update password",
        code: err.errors?.[0]?.code
      });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Create account",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 12 }}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
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
            
            <Text style={styles.passwordHint}>
              Password should contain at least 8 characters, a number and a symbol
            </Text>

            <View style={styles.passwordStrength}>
              <View style={[styles.strengthBar, password?.length > 0 ? styles.activeBar : {}]} />
              <View style={[styles.strengthBar, password?.length > 4 ? styles.activeBar : {}]} />
              <View style={[styles.strengthBar, password?.length > 8 ? styles.activeBar : {}]} />
              <View style={[styles.strengthBar, password?.length > 10 ? styles.activeBar : {}]} />
            </View>

            <Text style={styles.helperText}>
              Your password is exceptional and exceeds minimum standards
            </Text>
          </View>
        </ScrollView>

        <View style={[
          styles.footer,
          keyboardHeight > 0 && { paddingBottom: 10 }
        ]}>
          <CustomButton
            text="NEXT"
            onPress={handleSubmit(onReset)}
            style={[
              styles.nextButton,
              { opacity: (password && !errors.password) ? 1 : 0.5 }
            ]}
            disabled={!(password && !errors.password)}
          />
        </View>
      </View>

      {errorToast && (
        <Toast
          message={errorToast.message}
          code={errorToast.code}
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
    backgroundColor: "#2A2A2A",
    borderColor: "transparent",
    color: "#fff",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  passwordHint: {
    color: "#1DB954",
    fontSize: 12,
    marginBottom: 5,
  },
  passwordStrength: {
    flexDirection: "row",
    gap: 6,
    marginTop: 5,
  },
  strengthBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  activeBar: {
    backgroundColor: "#1DB954",
  },
  helperText: {
    color: "#ccc",
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#000",
  },
  nextButton: {
    backgroundColor: "#1D8954",
    width: "100%",
  },
});