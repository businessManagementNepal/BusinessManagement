import { Database } from "@nozbe/watermelondb";
import { useMemo } from "react";
import { LoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { useLanguageSelectionFeature } from "@/feature/session/hooks/useLanguageSelectionFeature";
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
  const language = useLanguageSelectionFeature({ database });

  const login = useAuthEntryLoginFeature({
    loginWithEmailUseCase,
    onSuccess,
  });

  const signUp = useAuthEntrySignUpFeature({
    signUpWithEmailUseCase,
    onSuccess,
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
