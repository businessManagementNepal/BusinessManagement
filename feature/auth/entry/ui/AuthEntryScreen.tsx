import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Eye, EyeOff, Lock, Phone, User } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dropdown,
  type DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { KeyboardSafeScrollView } from "@/shared/components/reusable/ScreenLayouts/KeyboardSafeScrollView";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { isSupportedLanguageCode, useTranslation } from "@/shared/i18n/resources";
import { LoginFormInput } from "@/feature/auth/login/types/login.types";
import {
  SignUpFormInput,
  SignUpProfileType,
} from "@/feature/auth/signUp/types/signUp.types";
import { AuthEntryViewModel } from "../viewModel/authEntry.viewModel";

type AuthEntryScreenProps = {
  viewModel: AuthEntryViewModel;
};

function AuthEntryScreenComponent({ viewModel }: AuthEntryScreenProps) {
  const { t } = useTranslation();
  const { language, mode, login, signUp, onForgotPasswordPress } = viewModel;
  const isAndroid = Platform.OS === "android";

  const {
    selectedLanguageCode,
    options: supportedLanguageOptions,
    onChangeSelectedLanguage,
  } = language;

  const {
    control: loginControl,
    selectedPhoneCountryCode: selectedLoginPhoneCountryCode,
    phoneNumberMaxLength: loginPhoneNumberMaxLength,
    phoneCountryOptions: loginPhoneCountryOptions,
    onChangeSelectedPhoneCountry: onChangeLoginSelectedPhoneCountry,
    clearSubmitError: clearLoginSubmitError,
    isPasswordVisible,
    togglePasswordVisibility: onTogglePasswordVisibility,
    isSubmitting,
    submitError,
    submit: onSubmit,
  } = login;

  const {
    control: signUpControl,
    selectedPhoneCountryCode,
    selectedProfileType,
    selectedBusinessType,
    businessTypeOptions,
    businessTypeError,
    phoneNumberMaxLength,
    phoneCountryOptions,
    onChangeSelectedPhoneCountry,
    onChangeSelectedProfileType,
    onChangeSelectedBusinessType,
    clearSubmitError: clearSignUpSubmitError,
    isPasswordVisible: isSignUpPasswordVisible,
    togglePasswordVisibility: onToggleSignUpPasswordVisibility,
    isSubmitting: isSigningUp,
    submitError: signUpError,
    submit: onSubmitSignUp,
  } = signUp;

  const insets = useSafeAreaInsets();
  const isLoginMode = mode.isLoginMode;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowSubscription = Keyboard.addListener(
      keyboardShowEvent,
      () => {
        setIsKeyboardVisible(true);
      },
    );
    const keyboardHideSubscription = Keyboard.addListener(
      keyboardHideEvent,
      () => {
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
    };
  }, []);

  const dropdownOptions = useMemo<DropdownOption[]>(
    () =>
      supportedLanguageOptions.map((option) => ({
        label: option.label,
        value: option.code,
      })),
    [supportedLanguageOptions],
  );

  const selectedSignUpPhoneCountryLabel = useMemo(() => {
    return (
      phoneCountryOptions.find((option) => option.code === selectedPhoneCountryCode)
        ?.label ?? phoneCountryOptions[0]?.label
    );
  }, [phoneCountryOptions, selectedPhoneCountryCode]);

  const selectedLoginPhoneCountryLabel = useMemo(() => {
    return (
      loginPhoneCountryOptions.find(
        (option) => option.code === selectedLoginPhoneCountryCode,
      )?.label ?? loginPhoneCountryOptions[0]?.label
    );
  }, [loginPhoneCountryOptions, selectedLoginPhoneCountryCode]);

  const signUpPhoneCountryDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      phoneCountryOptions.map((option) => ({
        label: `${option.flag} ${option.label}`,
        value: option.code,
      })),
    [phoneCountryOptions],
  );

  const loginPhoneCountryDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      loginPhoneCountryOptions.map((option) => ({
        label: `${option.flag} ${option.label}`,
        value: option.code,
      })),
    [loginPhoneCountryOptions],
  );

  const signUpBusinessTypeDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      businessTypeOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    [businessTypeOptions],
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

  const handleSignUpPhoneCountryChange = useCallback(
    (nextCountryCode: string): void => {
      const selectedCountryOption = phoneCountryOptions.find(
        (option) => option.code === nextCountryCode,
      );

      if (!selectedCountryOption) {
        return;
      }

      onChangeSelectedPhoneCountry(selectedCountryOption.code);
    },
    [onChangeSelectedPhoneCountry, phoneCountryOptions],
  );

  const handleLoginPhoneCountryChange = useCallback(
    (nextCountryCode: string): void => {
      const selectedCountryOption = loginPhoneCountryOptions.find(
        (option) => option.code === nextCountryCode,
      );

      if (!selectedCountryOption) {
        return;
      }

      onChangeLoginSelectedPhoneCountry(selectedCountryOption.code);
    },
    [loginPhoneCountryOptions, onChangeLoginSelectedPhoneCountry],
  );

  const handleSignUpProfileTypeChange = useCallback(
    (profileType: typeof SignUpProfileType.Personal | typeof SignUpProfileType.Business): void => {
      onChangeSelectedProfileType(profileType);
      clearSignUpSubmitError();
    },
    [clearSignUpSubmitError, onChangeSelectedProfileType],
  );

  const handleSignUpBusinessTypeChange = useCallback(
    (businessType: string): void => {
      const matchingOption = businessTypeOptions.find(
        (option) => option.value === businessType,
      );

      if (!matchingOption) {
        return;
      }

      onChangeSelectedBusinessType(matchingOption.value);
      clearSignUpSubmitError();
    },
    [businessTypeOptions, clearSignUpSubmitError, onChangeSelectedBusinessType],
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
        <View
          style={[
            styles.header,
            isKeyboardVisible ? styles.headerCompact : undefined,
            {
              paddingTop:
                insets.top +
                (isKeyboardVisible ? spacing.md : spacing.xxl + spacing.sm),
            },
          ]}
        >
          <View style={[styles.languageDropdownWrap, { top: insets.top + spacing.xs }]}>
            <Dropdown
              value={selectedLanguageCode}
              options={dropdownOptions}
              onChange={handleLanguageChange}
              placeholder={t("auth.entry.language.placeholder")}
              modalTitle="Choose language"
            />
          </View>

          <View style={[styles.logoBox, isKeyboardVisible ? styles.logoBoxCompact : undefined]}>
            <Text
              style={[
                styles.logoText,
                isKeyboardVisible ? styles.logoTextCompact : undefined,
              ]}
            >
              eL
            </Text>
          </View>

          <Text style={[styles.brand, isKeyboardVisible ? styles.brandCompact : undefined]}>
            eLekha
          </Text>
          {!isKeyboardVisible ? (
            <Text style={styles.brandSub}>{t("auth.entry.brand.subtitle")}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <KeyboardSafeScrollView
          contentContainerStyle={styles.scrollContent}
          bottomInset={insets.bottom}
        >
          <View style={styles.content}>
            <View style={styles.tabContainer}>
              <Pressable
                onPress={mode.switchToLogin}
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
                onPress={mode.switchToSignUp}
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
                <Text style={styles.inputLabel}>
                  {t("auth.entry.fields.profileType")}
                </Text>

                <View style={styles.profileTypeRow}>
                  <Pressable
                    style={[
                      styles.profileTypeButton,
                      selectedProfileType === SignUpProfileType.Personal
                        ? styles.profileTypeButtonActive
                        : undefined,
                    ]}
                    onPress={() =>
                      handleSignUpProfileTypeChange(SignUpProfileType.Personal)
                    }
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: selectedProfileType === SignUpProfileType.Personal,
                    }}
                  >
                    <Text
                      style={[
                        styles.profileTypeButtonText,
                        selectedProfileType === SignUpProfileType.Personal
                          ? styles.profileTypeButtonTextActive
                          : undefined,
                      ]}
                    >
                      {t("auth.entry.profileType.personal")}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.profileTypeButton,
                      selectedProfileType === SignUpProfileType.Business
                        ? styles.profileTypeButtonActive
                        : undefined,
                    ]}
                    onPress={() =>
                      handleSignUpProfileTypeChange(SignUpProfileType.Business)
                    }
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: selectedProfileType === SignUpProfileType.Business,
                    }}
                  >
                    <Text
                      style={[
                        styles.profileTypeButtonText,
                        selectedProfileType === SignUpProfileType.Business
                          ? styles.profileTypeButtonTextActive
                          : undefined,
                      ]}
                    >
                      {t("auth.entry.profileType.business")}
                    </Text>
                  </Pressable>
                </View>

                {selectedProfileType === SignUpProfileType.Business ? (
                  <View style={styles.businessTypeWrap}>
                    <Text style={styles.inputLabel}>
                      {t("auth.entry.fields.businessType")}
                    </Text>

                    <Dropdown
                      value={selectedBusinessType}
                      options={signUpBusinessTypeDropdownOptions}
                      onChange={handleSignUpBusinessTypeChange}
                      placeholder={t("auth.entry.placeholders.businessType")}
                      modalTitle={t("auth.entry.fields.businessType")}
                      showLeadingIcon={false}
                      disabled={isSigningUp}
                    />

                    {businessTypeError ? (
                      <Text style={styles.submitError}>{businessTypeError}</Text>
                    ) : null}
                  </View>
                ) : null}

                <TextField<SignUpFormInput>
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

                <View style={styles.phoneInputRow}>
                  <View style={styles.phoneCountryDropdownWrap}>
                    <Dropdown
                      value={selectedPhoneCountryCode}
                      options={signUpPhoneCountryDropdownOptions}
                      onChange={handleSignUpPhoneCountryChange}
                      placeholder="Country"
                      modalTitle="Choose country"
                      showLeadingIcon={false}
                      disabled={isSigningUp}
                      triggerStyle={styles.phoneCountryDropdownTrigger}
                      triggerTextStyle={styles.phoneCountryDropdownText}
                    />
                  </View>

                  <View style={styles.phoneNumberInputWrap}>
                    <TextField<SignUpFormInput>
                      control={signUpControl}
                      name="phoneNumber"
                      placeholder={t("auth.entry.fields.phoneNumber")}
                      leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                      keyboardType="number-pad"
                      autoComplete="off"
                      importantForAutofill="no"
                      maxLength={phoneNumberMaxLength}
                      onFocus={clearSignUpSubmitError}
                      editable={!isSigningUp}
                      accessibilityLabel={`${selectedSignUpPhoneCountryLabel ?? ""} ${t(
                        "auth.entry.fields.phoneNumber",
                      )}`}
                    />
                  </View>
                </View>

                <TextField<SignUpFormInput>
                  control={signUpControl}
                  name="password"
                  placeholder={t("auth.entry.fields.password")}
                  leftIcon={<Lock size={18} color={colors.mutedForeground} />}
                  secureTextEntry={!isSignUpPasswordVisible}
                  keyboardType="default"
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType={isAndroid ? "none" : undefined}
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
                <View style={styles.phoneInputRow}>
                  <View style={styles.phoneCountryDropdownWrap}>
                    <Dropdown
                      value={selectedLoginPhoneCountryCode}
                      options={loginPhoneCountryDropdownOptions}
                      onChange={handleLoginPhoneCountryChange}
                      placeholder="Country"
                      modalTitle="Choose country"
                      showLeadingIcon={false}
                      disabled={isSubmitting}
                      triggerStyle={styles.phoneCountryDropdownTrigger}
                      triggerTextStyle={styles.phoneCountryDropdownText}
                    />
                  </View>

                  <View style={styles.phoneNumberInputWrap}>
                    <TextField<LoginFormInput>
                      control={loginControl}
                      name="phoneNumber"
                      placeholder={t("auth.entry.fields.phoneNumber")}
                      leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                      keyboardType="number-pad"
                      autoComplete="off"
                      importantForAutofill="no"
                      maxLength={loginPhoneNumberMaxLength}
                      onFocus={clearLoginSubmitError}
                      editable={!isSubmitting}
                      accessibilityLabel={`${selectedLoginPhoneCountryLabel ?? ""} ${t(
                        "auth.entry.fields.phoneNumber",
                      )}`}
                    />
                  </View>
                </View>

                <TextField<LoginFormInput>
                  control={loginControl}
                  name="password"
                  placeholder={t("auth.entry.fields.password")}
                  leftIcon={<Lock size={18} color={colors.mutedForeground} />}
                  secureTextEntry={!isPasswordVisible}
                  keyboardType="default"
                  autoComplete={isAndroid ? "off" : "password"}
                  textContentType={isAndroid ? "none" : "password"}
                  importantForAutofill={isAndroid ? "no" : "auto"}
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

            <AppButton
              label={
                isPrimaryBusy ? t("auth.entry.actions.pleaseWait") : primaryLabel
              }
              variant="primary"
              size="lg"
              style={styles.primaryButton}
              onPress={handlePrimaryAction}
              disabled={isPrimaryDisabled}
              accessibilityState={{ disabled: isPrimaryDisabled, busy: isPrimaryBusy }}
            />

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorLabel}>{t("auth.entry.separator")}</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{footerPrompt} </Text>
              <Pressable
                onPress={mode.toggleMode}
                accessibilityRole="button"
              >
                <Text style={styles.footerLink}>{footerActionLabel}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardSafeScrollView>
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
  headerCompact: {
    paddingBottom: spacing.md,
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
  logoBoxCompact: {
    width: 44,
    height: 44,
    marginBottom: spacing.xs,
  },
  logoText: {
    color: colors.headerForeground,
    fontSize: 24,
    fontFamily: "InterBold",
    lineHeight: 28,
  },
  logoTextCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  brand: {
    color: colors.headerForeground,
    fontSize: 24,
    fontFamily: "InterBold",
    lineHeight: 28,
  },
  brandCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  brandSub: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 14,
    fontFamily: "InterMedium",
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
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
    fontFamily: "InterSemiBold",
  },
  tabLabelActive: {
    color: colors.primaryForeground,
  },
  form: {
    gap: spacing.md,
  },
  inputLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  profileTypeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  profileTypeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  profileTypeButtonText: {
    color: colors.foreground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  profileTypeButtonTextActive: {
    color: colors.primary,
    fontFamily: "InterBold",
  },
  businessTypeWrap: {
    gap: spacing.xs,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  phoneCountryDropdownWrap: {
    width: 152,
  },
  phoneCountryDropdownTrigger: {
    minHeight: 54,
    borderRadius: radius.lg,
  },
  phoneCountryDropdownText: {
    fontSize: 13,
    fontFamily: "InterSemiBold",
    color: colors.cardForeground,
  },
  phoneNumberInputWrap: {
    flex: 1,
  },
  forgotWrapper: {
    alignSelf: "flex-end",
  },
  forgot: {
    color: colors.primary,
    textAlign: "right",
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  submitError: {
    color: colors.destructive,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  primaryButton: {
    marginTop: spacing.md,
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
    fontFamily: "InterMedium",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  footerLink: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
});


