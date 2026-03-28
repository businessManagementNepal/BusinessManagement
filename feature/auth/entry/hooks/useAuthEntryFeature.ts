import { Database } from "@nozbe/watermelondb";
import { useMemo } from "react";
import { LoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { useLanguageSelectionFeature } from "@/feature/appSettings/hooks/useLanguageSelectionFeature";
import { useAuthEntryLoginFeature } from "./useAuthEntryLoginFeature";
import { useAuthEntrySignUpFeature } from "./useAuthEntrySignUpFeature";
import { AuthEntryViewModel } from "../viewModel/authEntry.viewModel";

type UseAuthEntryFeatureParams = {
  database: Database;
  loginWithEmailUseCase: LoginWithEmailUseCase;
  signUpWithEmailUseCase: SignUpWithEmailUseCase;
  onLoginSuccess?: () => void;
  onSignUpSuccess?: () => void;
  onForgotPasswordPress?: () => void;
};

export function useAuthEntryFeature(params: UseAuthEntryFeatureParams) {
  const {
    database,
    loginWithEmailUseCase,
    signUpWithEmailUseCase,
    onLoginSuccess,
    onSignUpSuccess,
    onForgotPasswordPress,
  } = params;
  const language = useLanguageSelectionFeature({ database });

  const login = useAuthEntryLoginFeature({
    loginWithEmailUseCase,
    onSuccess: onLoginSuccess,
  });

  const signUp = useAuthEntrySignUpFeature({
    signUpWithEmailUseCase,
    onSuccess: onSignUpSuccess,
  });

  const viewModel = useMemo<AuthEntryViewModel>(
    () => ({
      language,
      login,
      signUp,
      onForgotPasswordPress,
    }),
    [language, login, signUp, onForgotPasswordPress],
  );

  return { viewModel };
}

