import { Database } from "@nozbe/watermelondb";
import { useCallback, useMemo } from "react";
import { LoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { setSelectedLanguage } from "@/feature/session/data/appSession.store";
import {
  changeLanguage,
  SUPPORTED_LANGUAGE_OPTIONS,
  SupportedLanguageCode,
  useCurrentLanguageCode,
} from "@/shared/i18n/resources";
import { useAuthEntryLoginFeature } from "./useAuthEntryLoginFeature";
import { useAuthEntrySignUpFeature } from "./useAuthEntrySignUpFeature";
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

  const login = useAuthEntryLoginFeature({
    loginWithEmailUseCase,
    onSuccess,
  });

  const signUp = useAuthEntrySignUpFeature({
    signUpWithEmailUseCase,
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

  const viewModel = useMemo<AuthEntryViewModel>(
    () => ({
      language: {
        selectedLanguageCode,
        options: SUPPORTED_LANGUAGE_OPTIONS,
        onChangeSelectedLanguage,
      },
      login,
      signUp,
      onForgotPasswordPress,
    }),
    [
      selectedLanguageCode,
      onChangeSelectedLanguage,
      login,
      signUp,
      onForgotPasswordPress,
    ],
  );

  return { viewModel };
}
