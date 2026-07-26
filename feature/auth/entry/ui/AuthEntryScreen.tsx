import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { User } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dropdown,
  type DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { AuthAccountSwitchAction } from "@/shared/components/reusable/Auth/AuthAccountSwitchAction";
import { AuthPasswordField } from "@/shared/components/reusable/Auth/AuthPasswordField";
import { AuthPhoneNumberField } from "@/shared/components/reusable/Auth/AuthPhoneNumberField";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DefaultSection } from "@/shared/components/reusable/Form/FormSections";
import { KeyboardSafeEditableScreen } from "@/shared/components/reusable/ScreenLayouts/KeyboardSafeEditableScreen";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { isSupportedLanguageCode, useTranslation } from "@/shared/i18n/resources";
import { AuthPhoneCountryCode } from "@/shared/constants/authPhone.constants";
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
    (nextCountryCode: AuthPhoneCountryCode): void => {
      onChangeSelectedPhoneCountry(nextCountryCode);
      clearSignUpSubmitError();
    },
    [clearSignUpSubmitError, onChangeSelectedPhoneCountry],
  );

  const handleLoginPhoneCountryChange = useCallback(
    (nextCountryCode: AuthPhoneCountryCode): void => {
      onChangeLoginSelectedPhoneCountry(nextCountryCode);
      clearLoginSubmitError();
    },
    [clearLoginSubmitError, onChangeLoginSelectedPhoneCountry],
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
            { paddingTop: insets.top + 12 },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>eL</Text>
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brand}>eLekha</Text>
              {!isKeyboardVisible ? (
                <Text style={styles.brandSub} numberOfLines={1}>
                  {t("auth.entry.brand.subtitle")}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.languageDropdownWrap}>
            <Dropdown
              value={selectedLanguageCode}
              options={dropdownOptions}
              onChange={handleLanguageChange}
              placeholder={t("auth.entry.language.placeholder")}
              modalTitle="Choose language"
              triggerStyle={styles.languageDropdownTrigger}
            />
          </View>
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
              <DefaultSection
                key="signup-form"
                contentStyle={styles.form}
              >
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
                  onValueChange={clearSignUpSubmitError}
                  editable={!isSigningUp}
                  accessibilityLabel={t("auth.entry.fields.fullName")}
                />

                <AuthPhoneNumberField<SignUpFormInput>
                  accessibilityLabel={`${selectedSignUpPhoneCountryLabel ?? ""} ${t(
                    "auth.entry.fields.phoneNumber",
                  )}`}
                  control={signUpControl}
                  countryModalTitle="Choose country"
                  countryPlaceholder="Country"
                  editable={!isSigningUp}
                  name="phoneNumber"
                  onChangeSelectedPhoneCountry={handleSignUpPhoneCountryChange}
                  onFocus={clearSignUpSubmitError}
                  onValueChange={clearSignUpSubmitError}
                  phoneCountryOptions={phoneCountryOptions}
                  phoneNumberMaxLength={phoneNumberMaxLength}
                  placeholder={t("auth.entry.fields.phoneNumber")}
                  selectedPhoneCountryCode={selectedPhoneCountryCode}
                />

                <AuthPasswordField<SignUpFormInput>
                  accessibilityLabel={t("auth.entry.fields.password")}
                  autoComplete="off"
                  control={signUpControl}
                  editable={!isSigningUp}
                  importantForAutofill="no"
                  name="password"
                  onFocus={clearSignUpSubmitError}
                  onTogglePasswordVisibility={onToggleSignUpPasswordVisibility}
                  onValueChange={clearSignUpSubmitError}
                  placeholder={t("auth.entry.fields.password")}
                  textContentType={isAndroid ? "none" : undefined}
                  visibilityAccessibilityLabel="Toggle sign up password visibility"
                  isPasswordVisible={isSignUpPasswordVisible}
                />

                {signUpError ? <Text style={styles.submitError}>{signUpError}</Text> : null}
              </DefaultSection>
            ) : (
              <DefaultSection
                key="login-form"
                title={t("auth.entry.tabs.login")}
                contentStyle={styles.form}
              >
                <AuthPhoneNumberField<LoginFormInput>
                  accessibilityLabel={`${selectedLoginPhoneCountryLabel ?? ""} ${t(
                    "auth.entry.fields.phoneNumber",
                  )}`}
                  control={loginControl}
                  countryModalTitle="Choose country"
                  countryPlaceholder="Country"
                  editable={!isSubmitting}
                  name="phoneNumber"
                  onChangeSelectedPhoneCountry={handleLoginPhoneCountryChange}
                  onFocus={clearLoginSubmitError}
                  onValueChange={clearLoginSubmitError}
                  phoneCountryOptions={loginPhoneCountryOptions}
                  phoneNumberMaxLength={loginPhoneNumberMaxLength}
                  placeholder={t("auth.entry.fields.phoneNumber")}
                  selectedPhoneCountryCode={selectedLoginPhoneCountryCode}
                />

                <AuthPasswordField<LoginFormInput>
                  accessibilityLabel={t("auth.entry.fields.password")}
                  autoComplete={isAndroid ? "off" : "password"}
                  control={loginControl}
                  editable={!isSubmitting}
                  importantForAutofill={isAndroid ? "no" : "auto"}
                  name="password"
                  onFocus={clearLoginSubmitError}
                  onTogglePasswordVisibility={onTogglePasswordVisibility}
                  onValueChange={clearLoginSubmitError}
                  placeholder={t("auth.entry.fields.password")}
                  textContentType={isAndroid ? "none" : "password"}
                  visibilityAccessibilityLabel="Toggle password visibility"
                  isPasswordVisible={isPasswordVisible}
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
              </DefaultSection>
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

            <AuthAccountSwitchAction
              actionLabel={footerActionLabel}
              message={footerPrompt}
              onPress={mode.toggleMode}
            />
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
      minWidth: 120,
    },
    languageDropdownTrigger: {
      minHeight: theme.scaleSpace(42),
    },
    header: {
      backgroundColor: theme.colors.header,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
      paddingHorizontal: theme.scaleSpace(16),
      paddingBottom: theme.scaleSpace(18),
    },
    brandRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(12),
    },
    logoBox: {
      width: theme.scaleSpace(42),
      height: theme.scaleSpace(42),
      borderRadius: radius.pill,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      color: theme.colors.headerForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterBold",
    },
    brandTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    brand: {
      color: theme.colors.headerForeground,
      fontSize: theme.scaleText(20),
      fontFamily: "InterBold",
      lineHeight: theme.scaleLineHeight(24),
    },
    brandSub: {
      color: "rgba(255,255,255,0.8)",
      marginTop: 2,
      fontSize: theme.scaleText(11),
      fontFamily: "InterMedium",
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
  });


