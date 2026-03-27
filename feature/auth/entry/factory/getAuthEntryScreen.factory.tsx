import React from "react";
import { Database } from "@nozbe/watermelondb";
import { createLocalLoginRepositoryWithDatabase } from "@/feature/auth/login/factory/local.login.repository.factory";
import { createLoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase.impl";
import { createLocalSignUpRepositoryWithDatabase } from "@/feature/auth/signUp/factory/local.signUp.repository.factory";
import { createSignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase.impl";
import { useAuthEntryFeature } from "../hooks/useAuthEntryFeature";
import { AuthEntryScreen } from "../ui/AuthEntryScreen";

type GetAuthEntryScreenFactoryProps = {
  database: Database;
  onSuccess?: () => void;
  onForgotPasswordPress?: () => void;
};

export function GetAuthEntryScreenFactory({
  database,
  onSuccess,
  onForgotPasswordPress,
}: GetAuthEntryScreenFactoryProps) {
  const loginRepository = React.useMemo(
    () => createLocalLoginRepositoryWithDatabase(database),
    [database],
  );

  const signUpRepository = React.useMemo(
    () => createLocalSignUpRepositoryWithDatabase(database),
    [database],
  );

  const loginWithEmailUseCase = React.useMemo(
    () => createLoginWithEmailUseCase(loginRepository),
    [loginRepository],
  );

  const signUpWithEmailUseCase = React.useMemo(
    () => createSignUpWithEmailUseCase(signUpRepository),
    [signUpRepository],
  );

  const { viewModel } = useAuthEntryFeature({
    database,
    loginWithEmailUseCase,
    signUpWithEmailUseCase,
    onSuccess,
    onForgotPasswordPress,
  });

  return <AuthEntryScreen viewModel={viewModel} />;
}
