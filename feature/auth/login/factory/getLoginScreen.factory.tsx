import React from "react";
import { Database } from "@nozbe/watermelondb";
import { createLoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase.impl";
import { LoginScreenContainer } from "../ui/LoginScreenContainer";
import { createLocalLoginRepositoryWithDatabase } from "./local.login.repository.factory";

type GetLoginScreenFactoryProps = {
  database: Database;
  onSuccess?: () => void;
  onForgotPasswordPress?: () => void;
  onSignUpPress?: () => void;
};

export function GetLoginScreenFactory({
  database,
  onSuccess,
  onForgotPasswordPress,
  onSignUpPress,
}: GetLoginScreenFactoryProps) {
  const repository = createLocalLoginRepositoryWithDatabase(database);
  const loginWithEmailUseCase = createLoginWithEmailUseCase(repository);

  return (
    <LoginScreenContainer
      loginWithEmailUseCase={loginWithEmailUseCase}
      onSuccess={onSuccess}
      onForgotPasswordPress={onForgotPasswordPress}
      onSignUpPress={onSignUpPress}
    />
  );
}