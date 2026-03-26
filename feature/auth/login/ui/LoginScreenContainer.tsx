import React from "react";
import { Status } from "@/shared/types/status.types";
import { LoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase";
import { useLoginViewModel } from "../viewModel/login.viewModel.impl";
import { LoginScreen } from "./LoginScreen";

type LoginScreenContainerProps = {
  loginWithEmailUseCase: LoginWithEmailUseCase;
  onSuccess?: () => void;
  onForgotPasswordPress?: () => void;
  onSignUpPress?: () => void;
};

export function LoginScreenContainer({
  loginWithEmailUseCase,
  onSuccess,
  onForgotPasswordPress,
  onSignUpPress,
}: LoginScreenContainerProps) {
  const viewModel = useLoginViewModel(loginWithEmailUseCase, { onSuccess });

  const submitError =
    viewModel.state.status === Status.Failure ? viewModel.state.error : undefined;

  return (
    <LoginScreen
      onSubmit={viewModel.submit}
      email={viewModel.email}
      password={viewModel.password}
      onEmailChange={viewModel.changeEmail}
      onPasswordChange={viewModel.changePassword}
      isPasswordVisible={viewModel.isPasswordVisible}
      onTogglePasswordVisibility={viewModel.togglePasswordVisibility}
      isSubmitting={viewModel.state.status === Status.Loading}
      submitError={submitError}
      onForgotPasswordPress={onForgotPasswordPress}
      onSignUpPress={onSignUpPress}
    />
  );
}