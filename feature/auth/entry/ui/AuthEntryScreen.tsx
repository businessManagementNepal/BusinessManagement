import React, { useCallback, useMemo, useState } from "react";
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
import {
  isSupportedLanguageCode,
  useTranslation,
} from "@/shared/i18n/resources";
import { LoginInput } from "@/feature/auth/login/types/login.types";
import { SignUpInput } from "@/feature/auth/signUp/types/signUp.types";
import { AuthEntryViewModel } from "../viewModel/authEntry.viewModel";

type AuthMode = "login" | "signup";

type AuthEntryScreenProps = {
  viewModel: AuthEntryViewModel;
};

function AuthEntryScreenComponent({ viewModel }: AuthEntryScreenProps) {
  const { t } = useTranslation();
  const { language, login, signUp, onForgotPasswordPress } = viewModel;

  const {
    selectedLanguageCode,
    options: supportedLanguageOptions,
    onChangeSelectedLanguage,
  } = language;

  const {
    control: loginControl,
    clearSubmitError: clearLoginSubmitError,
    isPasswordVisible,
    togglePasswordVisibility: onTogglePasswordVisibility,
    isSubmitting,
    submitError,
    submit: onSubmit,
  } = login;

  const {
    control: signUpControl,
    clearSubmitError: clearSignUpSubmitError,
    isPasswordVisible: isSignUpPasswordVisible,
    togglePasswordVisibility: onToggleSignUpPasswordVisibility,
    isSubmitting: isSigningUp,
    submitError: signUpError,
    submit: onSubmitSignUp,
  } = signUp;

  const [mode, setMode] = useState<AuthMode>("login");

  const insets = useSafeAreaInsets();
  const isLoginMode = mode === "login";

  const dropdownOptions = useMemo<DropdownOption[]>(
    () =>
      supportedLanguageOptions.map((option) => ({
        label: option.label,
        value: option.code,
      })),
    [supportedLanguageOptions],
  );

  const handleLanguageChange = useCallback(
    (nextLanguageCode: string): void => {
      if (!isSupportedLanguageCode(nextLanguageCode)) {
        return;
      }

      onChangeSelectedLanguage(nextLanguageCode);
    },
    [onChangeSelectedLanguage],
  );

  const primaryLabel = isLoginMode
    ? t("auth.entry.actions.login")
    : t("auth.entry.actions.createAccount");

  const isPrimaryBusy = isLoginMode ? isSubmitting : isSigningUp;
  const isPrimaryDisabled = isLoginMode ? isSubmitting : isSigningUp;

  const handlePrimaryAction = () => {
    if (isLoginMode) {
      return onSubmit();
    }

    return onSubmitSignUp();
  };

  const footerPrompt = isLoginMode
    ? t("auth.entry.footer.noAccount")
    : t("auth.entry.footer.haveAccount");

  const footerActionLabel = isLoginMode
    ? t("auth.entry.footer.signUp")
    : t("auth.entry.footer.login");

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.xxl + spacing.sm }]}>
          <View style={[styles.languageDropdownWrap, { top: insets.top + spacing.xs }]}>
            <Dropdown
              value={selectedLanguageCode}
              options={dropdownOptions}
              onChange={handleLanguageChange}
              placeholder={t("auth.entry.language.placeholder")}
            />
          </View>

          <View style={styles.logoBox}>
            <Text style={styles.logoText}>eL</Text>
          </View>

          <Text style={styles.brand}>eLekha</Text>
          <Text style={styles.brandSub}>{t("auth.entry.brand.subtitle")}</Text>
        </View>

        <View style={styles.divider} />

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                  {t("auth.entry.tabs.login")}
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
                  {t("auth.entry.tabs.signUp")}
                </Text>
              </Pressable>
            </View>

            {!isLoginMode ? (
              <View key="signup-form" style={styles.form}>
                <TextField<SignUpInput>
                  control={signUpControl}
                  name="fullName"
                  placeholder={t("auth.entry.fields.fullName")}
                  leftIcon={<User size={18} color={colors.mutedForeground} />}
                  autoCapitalize="words"
                  autoComplete="off"
                  importantForAutofill="no"
                  onFocus={clearSignUpSubmitError}
                  editable={!isSigningUp}
                  accessibilityLabel={t("auth.entry.fields.fullName")}
                />

                <TextField<SignUpInput>
                  control={signUpControl}
                  name="phoneNumber"
                  placeholder={t("auth.entry.fields.phoneNumber")}
                  leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                  keyboardType="phone-pad"
                  autoComplete="off"
                  importantForAutofill="no"
                  onFocus={clearSignUpSubmitError}
                  editable={!isSigningUp}
                  accessibilityLabel={t("auth.entry.fields.phoneNumber")}
                />

                <TextField<SignUpInput>
                  control={signUpControl}
                  name="password"
                  placeholder={t("auth.entry.fields.password")}
                  leftIcon={<Lock size={18} color={colors.mutedForeground} />}
                  secureTextEntry={!isSignUpPasswordVisible}
                  autoComplete="off"
                  importantForAutofill="no"
                  onFocus={clearSignUpSubmitError}
                  editable={!isSigningUp}
                  accessibilityLabel={t("auth.entry.fields.password")}
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
              <View key="login-form" style={styles.form}>
                <TextField<LoginInput>
                  control={loginControl}
                  name="phoneNumber"
                  placeholder={t("auth.entry.fields.phoneNumber")}
                  leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  onFocus={clearLoginSubmitError}
                  editable={!isSubmitting}
                  accessibilityLabel={t("auth.entry.fields.phoneNumber")}
                />

                <TextField<LoginInput>
                  control={loginControl}
                  name="password"
                  placeholder={t("auth.entry.fields.password")}
                  leftIcon={<Lock size={18} color={colors.mutedForeground} />}
                  secureTextEntry={!isPasswordVisible}
                  autoComplete="password"
                  textContentType="password"
                  onFocus={clearLoginSubmitError}
                  editable={!isSubmitting}
                  accessibilityLabel={t("auth.entry.fields.password")}
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
                    <Text style={styles.forgot}>
                      {t("auth.entry.actions.forgotPassword")}
                    </Text>
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
                {isPrimaryBusy ? t("auth.entry.actions.pleaseWait") : primaryLabel}
              </Text>
            </Pressable>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorLabel}>{t("auth.entry.separator")}</Text>
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

export const AuthEntryScreen = React.memo(AuthEntryScreenComponent);

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
