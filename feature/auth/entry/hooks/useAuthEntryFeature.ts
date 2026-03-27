import { Database } from "@nozbe/watermelondb";
import { useCallback, useMemo } from "react";
import { useLoginViewModel } from "@/feature/auth/login/viewModel/login.viewModel.impl";
import { LoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase";
import { useSignUpViewModel } from "@/feature/auth/signUp/viewModel/signUp.viewModel.impl";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { setSelectedLanguage } from "@/feature/session/data/appSession.store";
import {
  changeLanguage,
  SUPPORTED_LANGUAGE_OPTIONS,
  SupportedLanguageCode,
  useCurrentLanguageCode,
} from "@/shared/i18n/resources";
import { Status } from "@/shared/types/status.types";
import { AuthEntryViewModel } from "../viewModel/authEntry.viewModel";

type UseAuthEntryFeatureParams = {
  database: Database;
  loginWithEmailUseCase: LoginWithEmailUseCase;
  signUpWithEmailUseCase: SignUpWithEmailUseCase;
  onSuccess?: () => void;
  onForgotPasswordPress?: () => void;
};

export function useAuthEntryFeature(params: UseAuthEntryFeatureParams) {
  const {
    database,
    loginWithEmailUseCase,
    signUpWithEmailUseCase,
    onSuccess,
    onForgotPasswordPress,
  } = params;

  const selectedLanguageCode = useCurrentLanguageCode();

  const loginViewModel = useLoginViewModel(loginWithEmailUseCase, {
    onSuccess,
  });

  const signUpViewModel = useSignUpViewModel(signUpWithEmailUseCase, {
    onSuccess,
  });

  const onChangeSelectedLanguage = useCallback(
    (languageCode: SupportedLanguageCode): void => {
      changeLanguage(languageCode);

      void setSelectedLanguage(database, languageCode).catch((error) => {
        console.error("Failed to persist selected language.", error);
      });
    },
    [database],
  );

  const isLoginSubmitting = loginViewModel.state.status === Status.Loading;
  const loginSubmitError =
    loginViewModel.state.status === Status.Failure
      ? loginViewModel.state.error
      : undefined;

  const isSignUpSubmitting = signUpViewModel.state.status === Status.Loading;
  const signUpSubmitError =
    signUpViewModel.state.status === Status.Failure
      ? signUpViewModel.state.error
      : undefined;

  const viewModel = useMemo<AuthEntryViewModel>(
    () => ({
      language: {
        selectedLanguageCode,
        options: SUPPORTED_LANGUAGE_OPTIONS,
        onChangeSelectedLanguage,
      },
      login: {
        control: loginViewModel.control,
        clearSubmitError: loginViewModel.clearSubmitError,
        isPasswordVisible: loginViewModel.isPasswordVisible,
        togglePasswordVisibility: loginViewModel.togglePasswordVisibility,
        isSubmitting: isLoginSubmitting,
        submitError: loginSubmitError,
        submit: loginViewModel.submit,
      },
      signUp: {
        control: signUpViewModel.control,
        selectedPhoneCountryCode: signUpViewModel.selectedPhoneCountryCode,
        selectedPhoneDialCode: signUpViewModel.selectedPhoneDialCode,
        phoneNumberMaxLength: signUpViewModel.phoneNumberMaxLength,
        phoneCountryOptions: signUpViewModel.phoneCountryOptions,
        onChangeSelectedPhoneCountry: signUpViewModel.onChangeSelectedPhoneCountry,
        clearSubmitError: signUpViewModel.clearSubmitError,
        isPasswordVisible: signUpViewModel.isPasswordVisible,
        togglePasswordVisibility: signUpViewModel.togglePasswordVisibility,
        isSubmitting: isSignUpSubmitting,
        submitError: signUpSubmitError,
        submit: signUpViewModel.submit,
      },
      onForgotPasswordPress,
    }),
    [
      selectedLanguageCode,
      onChangeSelectedLanguage,
      isLoginSubmitting,
      loginSubmitError,
      loginViewModel.clearSubmitError,
      loginViewModel.control,
      loginViewModel.isPasswordVisible,
      loginViewModel.submit,
      loginViewModel.togglePasswordVisibility,
      isSignUpSubmitting,
      signUpSubmitError,
      signUpViewModel.clearSubmitError,
      signUpViewModel.control,
      signUpViewModel.isPasswordVisible,
      signUpViewModel.onChangeSelectedPhoneCountry,
      signUpViewModel.phoneNumberMaxLength,
      signUpViewModel.phoneCountryOptions,
      signUpViewModel.selectedPhoneDialCode,
      signUpViewModel.selectedPhoneCountryCode,
      signUpViewModel.submit,
      signUpViewModel.togglePasswordVisibility,
      onForgotPasswordPress,
    ],
  );

  return { viewModel };
}
