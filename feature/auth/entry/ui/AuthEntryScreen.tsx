import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Eye, EyeOff, Lock, Phone, User } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dropdown,
  type DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { KeyboardSafeEditableScreen } from "@/shared/components/reusable/ScreenLayouts/KeyboardSafeEditableScreen";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
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
  const {
    language,
    mode,
    login,
    signUp,
    onForgotPasswordPress,
    isForgotPasswordEnabled,
  } = viewModel;
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

  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
                (isKeyboardVisible
                  ? theme.scaleSpace(spacing.md)
                  : theme.scaleSpace(spacing.xxl + spacing.sm)),
            },
          ]}
        >
          <View
            style={[
              styles.languageDropdownWrap,
              { top: insets.top + theme.scaleSpace(spacing.xs) },
            ]}
          >
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

        <KeyboardSafeEditableScreen
          contentContainerStyle={styles.scrollContent}
          bottomInsetPadding={theme.scaleSpace(spacing.xxl) + insets.bottom}
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
                  leftIcon={<User size={18} color={theme.colors.mutedForeground} />}
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
                      leftIcon={<Phone size={18} color={theme.colors.mutedForeground} />}
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
                  leftIcon={<Lock size={18} color={theme.colors.mutedForeground} />}
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
                        <EyeOff size={18} color={theme.colors.mutedForeground} />
                      ) : (
                        <Eye size={18} color={theme.colors.mutedForeground} />
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
                      leftIcon={<Phone size={18} color={theme.colors.mutedForeground} />}
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
                  leftIcon={<Lock size={18} color={theme.colors.mutedForeground} />}
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
                        <EyeOff size={18} color={theme.colors.mutedForeground} />
                      ) : (
                        <Eye size={18} color={theme.colors.mutedForeground} />
                      )}
                    </Pressable>
                  }
                />

                {isForgotPasswordEnabled ? (
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
        </KeyboardSafeEditableScreen>
      </View>
    </SafeAreaView>
  );
}

export const AuthEntryScreen = React.memo(AuthEntryScreenComponent);

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    languageDropdownWrap: {
      position: "absolute",
      right: theme.scaleSpace(spacing.md),
      zIndex: 2,
      minWidth: 120,
    },
    header: {
      backgroundColor: theme.colors.header,
      alignItems: "center",
      paddingHorizontal: theme.scaleSpace(spacing.xl),
      paddingBottom: theme.scaleSpace(spacing.xxl + spacing.sm),
      position: "relative",
    },
    headerCompact: {
      paddingBottom: theme.scaleSpace(spacing.md),
    },
    logoBox: {
      width: 64,
      height: 64,
      borderRadius: radius.xl,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.scaleSpace(spacing.md),
    },
    logoBoxCompact: {
      width: 44,
      height: 44,
      marginBottom: theme.scaleSpace(spacing.xs),
    },
    logoText: {
      color: theme.colors.headerForeground,
      fontSize: theme.scaleText(24),
      fontFamily: "InterBold",
      lineHeight: theme.scaleLineHeight(28),
    },
    logoTextCompact: {
      fontSize: theme.scaleText(20),
      lineHeight: theme.scaleLineHeight(24),
    },
    brand: {
      color: theme.colors.headerForeground,
      fontSize: theme.scaleText(24),
      fontFamily: "InterBold",
      lineHeight: theme.scaleLineHeight(28),
    },
    brandCompact: {
      fontSize: theme.scaleText(20),
      lineHeight: theme.scaleLineHeight(24),
    },
    brandSub: {
      color: "rgba(255,255,255,0.8)",
      marginTop: 4,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
      textAlign: "center",
    },
    divider: {
      height: 4,
      backgroundColor: theme.colors.destructive,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.xl),
      paddingBottom: theme.scaleSpace(spacing.md),
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.muted,
      borderRadius: radius.lg,
      padding: 4,
      marginBottom: theme.scaleSpace(spacing.xl),
    },
    tabButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    tabButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    tabLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    tabLabelActive: {
      color: theme.colors.primaryForeground,
    },
    form: {
      gap: theme.scaleSpace(spacing.md),
    },
    inputLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
    },
    profileTypeRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    profileTypeButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    profileTypeButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.accent,
    },
    profileTypeButtonText: {
      color: theme.colors.foreground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    profileTypeButtonTextActive: {
      color: theme.colors.primary,
      fontFamily: "InterBold",
    },
    businessTypeWrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    phoneInputRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.sm),
    },
    phoneCountryDropdownWrap: {
      width: 152,
    },
    phoneCountryDropdownTrigger: {
      minHeight: 54,
      borderRadius: radius.lg,
    },
    phoneCountryDropdownText: {
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
      color: theme.colors.cardForeground,
    },
    phoneNumberInputWrap: {
      flex: 1,
    },
    forgotWrapper: {
      alignSelf: "flex-end",
    },
    forgot: {
      color: theme.colors.primary,
      textAlign: "right",
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    submitError: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    primaryButton: {
      marginTop: theme.scaleSpace(spacing.md),
    },
    separatorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
      marginTop: theme.scaleSpace(spacing.xl),
      marginBottom: theme.scaleSpace(spacing.xl),
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    separatorLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    footerText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    footerLink: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(12),
      fontFamily: "InterSemiBold",
    },
  });


