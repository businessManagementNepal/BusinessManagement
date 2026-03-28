import { Database } from "@nozbe/watermelondb";
import { useMemo } from "react";
import { LoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { useAuthEntryLanguageViewModel } from "./authEntry.language.viewModel.impl";
import { useAuthEntryLoginViewModel } from "./authEntry.login.viewModel.impl";
import { useAuthEntrySignUpViewModel } from "./authEntry.signUp.viewModel.impl";
import { AuthEntryViewModel } from "./authEntry.viewModel";

type UseAuthEntryViewModelParams = {
  database: Database;
  loginWithEmailUseCase: LoginWithEmailUseCase;
  signUpWithEmailUseCase: SignUpWithEmailUseCase;
  onLoginSuccess?: () => void;
  onSignUpSuccess?: () => void;
  onForgotPasswordPress?: () => void;
};

export const useAuthEntryViewModel = (
  params: UseAuthEntryViewModelParams,
): AuthEntryViewModel => {
  const {
    database,
    loginWithEmailUseCase,
    signUpWithEmailUseCase,
    onLoginSuccess,
    onSignUpSuccess,
    onForgotPasswordPress,
  } = params;

  const language = useAuthEntryLanguageViewModel({ database });

  const login = useAuthEntryLoginViewModel({
    loginWithEmailUseCase,
    onSuccess: onLoginSuccess,
  });

  const signUp = useAuthEntrySignUpViewModel({
    signUpWithEmailUseCase,
    onSuccess: onSignUpSuccess,
  });

  return useMemo<AuthEntryViewModel>(
    () => ({
      language,
      login,
      signUp,
      onForgotPasswordPress,
    }),
    [language, login, signUp, onForgotPasswordPress],
  );
};
