import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Eye, EyeOff, Lock, Phone, User } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dropdown,
  type DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type AuthMode = "login" | "signup";

const LANGUAGE_OPTIONS: DropdownOption[] = [{ label: "English", value: "en" }];

interface LoginScreenProps {
  onSubmit: () => void | Promise<void>;
  phoneNumber: string;
  password: string;
  onPhoneNumberChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  isSubmitting: boolean;
  submitError?: string;
  onForgotPasswordPress?: () => void;

  signUpFullName: string;
  signUpPhoneNumber: string;
  signUpPassword: string;
  onSignUpFullNameChange: (value: string) => void;
  onSignUpPhoneNumberChange: (value: string) => void;
  onSignUpPasswordChange: (value: string) => void;
  isSignUpPasswordVisible: boolean;
  onToggleSignUpPasswordVisibility: () => void;
  isSigningUp: boolean;
  signUpError?: string;
  onSubmitSignUp: () => void | Promise<void>;
}

export function LoginScreen({
  onSubmit,
  phoneNumber,
  password,
  onPhoneNumberChange,
  onPasswordChange,
  isPasswordVisible,
  onTogglePasswordVisibility,
  isSubmitting,
  submitError,
  onForgotPasswordPress,
  signUpFullName,
  signUpPhoneNumber,
  signUpPassword,
  onSignUpFullNameChange,
  onSignUpPhoneNumberChange,
  onSignUpPasswordChange,
  isSignUpPasswordVisible,
  onToggleSignUpPasswordVisibility,
  isSigningUp,
  signUpError,
  onSubmitSignUp,
}: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [language, setLanguage] = useState("en");

  const insets = useSafeAreaInsets();
  const isLoginMode = mode === "login";
  const primaryLabel = isLoginMode ? "Login" : "Create Account";
  const isPrimaryBusy = isLoginMode ? isSubmitting : isSigningUp;
  const isPrimaryDisabled = isLoginMode ? isSubmitting : isSigningUp;

  const handlePrimaryAction = () => {
    if (isLoginMode) {
      return onSubmit();
    }

    return onSubmitSignUp();
  };

  const footerPrompt = isLoginMode
    ? "Don't have an account?"
    : "Already have an account?";
  const footerActionLabel = isLoginMode ? "Sign Up" : "Login";

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.xxl + spacing.sm }]}>
          <View style={[styles.languageDropdownWrap, { top: insets.top + spacing.xs }]}>
            <Dropdown
              value={language}
              options={LANGUAGE_OPTIONS}
              onChange={setLanguage}
              placeholder="English"
            />
          </View>

          <View style={styles.logoBox}>
            <Text style={styles.logoText}>eL</Text>
          </View>

          <Text style={styles.brand}>eLekha</Text>
          <Text style={styles.brandSub}>Your Business & Finance Companion</Text>
        </View>

        <View style={styles.divider} />

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <View style={styles.tabContainer}>
              <Pressable
                onPress={() => setMode("login")}
                style={[
                  styles.tabButton,
                  isLoginMode ? styles.tabButtonActive : undefined,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isLoginMode ? styles.tabLabelActive : undefined,
                  ]}
                >
                  Login
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("signup")}
                style={[
                  styles.tabButton,
                  !isLoginMode ? styles.tabButtonActive : undefined,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.tabLabel,
                    !isLoginMode ? styles.tabLabelActive : undefined,
                  ]}
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {!isLoginMode ? (
              <View style={styles.form}>
                <TextField
                  placeholder="Full Name"
                  leftIcon={<User size={18} color={colors.mutedForeground} />}
                  autoCapitalize="words"
                  value={signUpFullName}
                  onChangeText={onSignUpFullNameChange}
                />

                <TextField
                  placeholder="Phone Number"
                  leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                  keyboardType="phone-pad"
                  value={signUpPhoneNumber}
                  onChangeText={onSignUpPhoneNumberChange}
                />

                <TextField
                  placeholder="Password"
                  leftIcon={<Lock size={18} color={colors.mutedForeground} />}
                  secureTextEntry={!isSignUpPasswordVisible}
                  value={signUpPassword}
                  onChangeText={onSignUpPasswordChange}
                  rightIcon={
                    <Pressable
                      onPress={onToggleSignUpPasswordVisibility}
                      accessibilityRole="button"
                      accessibilityLabel="Toggle sign up password visibility"
                    >
                      {isSignUpPasswordVisible ? (
                        <EyeOff size={18} color={colors.mutedForeground} />
                      ) : (
                        <Eye size={18} color={colors.mutedForeground} />
                      )}
                    </Pressable>
                  }
                />

                {signUpError ? <Text style={styles.submitError}>{signUpError}</Text> : null}
              </View>
            ) : (
              <View style={styles.form}>
                <TextField
                  placeholder="Phone Number"
                  leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                  value={phoneNumber}
                  onChangeText={onPhoneNumberChange}
                  keyboardType="phone-pad"
                />

                <TextField
                  placeholder="Password"
                  leftIcon={<Lock size={18} color={colors.mutedForeground} />}
                  value={password}
                  onChangeText={onPasswordChange}
                  secureTextEntry={!isPasswordVisible}
                  rightIcon={
                    <Pressable
                      onPress={onTogglePasswordVisibility}
                      accessibilityRole="button"
                      accessibilityLabel="Toggle password visibility"
                    >
                      {isPasswordVisible ? (
                        <EyeOff size={18} color={colors.mutedForeground} />
                      ) : (
                        <Eye size={18} color={colors.mutedForeground} />
                      )}
                    </Pressable>
                  }
                />

                {onForgotPasswordPress ? (
                  <Pressable
                    style={styles.forgotWrapper}
                    onPress={onForgotPasswordPress}
                    accessibilityRole="button"
                  >
                    <Text style={styles.forgot}>Forgot Password?</Text>
                  </Pressable>
                ) : null}

                {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
              </View>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                isPrimaryDisabled ? styles.primaryButtonDisabled : undefined,
              ]}
              onPress={handlePrimaryAction}
              disabled={isPrimaryDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: isPrimaryDisabled, busy: isPrimaryBusy }}
            >
              <Text style={styles.primaryButtonText}>
                {isPrimaryBusy ? "Please wait..." : primaryLabel}
              </Text>
            </Pressable>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorLabel}>or continue with</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{footerPrompt} </Text>
              <Pressable
                onPress={() => setMode(isLoginMode ? "signup" : "login")}
                accessibilityRole="button"
              >
                <Text style={styles.footerLink}>{footerActionLabel}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  languageDropdownWrap: {
    position: "absolute",
    right: spacing.md,
    zIndex: 2,
    minWidth: 120,
  },
  header: {
    backgroundColor: colors.header,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.sm,
    position: "relative",
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoText: {
    color: colors.headerForeground,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
  brand: {
    color: colors.headerForeground,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
  brandSub: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  divider: {
    height: 4,
    backgroundColor: colors.destructive,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.primaryForeground,
  },
  form: {
    gap: spacing.md,
  },
  forgotWrapper: {
    alignSelf: "flex-end",
  },
  forgot: {
    color: colors.primary,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "500",
  },
  submitError: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontWeight: "600",
    fontSize: 14,
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "500",
  },
  footerLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
});
