import React from "react";
import { Status } from "@/shared/types/status.types";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { useSignUpViewModel } from "@/feature/auth/signUp/viewModel/signUp.viewModel.impl";
import { LoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase";
import { useLoginViewModel } from "../viewModel/login.viewModel.impl";
import { LoginScreen } from "./LoginScreen";

type LoginScreenContainerProps = {
  loginWithEmailUseCase: LoginWithEmailUseCase;
  signUpWithEmailUseCase: SignUpWithEmailUseCase;
  onSuccess?: () => void;
  onForgotPasswordPress?: () => void;
};

export function LoginScreenContainer({
  loginWithEmailUseCase,
  signUpWithEmailUseCase,
  onSuccess,
  onForgotPasswordPress,
}: LoginScreenContainerProps) {
  const loginViewModel = useLoginViewModel(loginWithEmailUseCase, { onSuccess });
  const signUpViewModel = useSignUpViewModel(signUpWithEmailUseCase, {
    onSuccess,
  });

  const loginSubmitError =
    loginViewModel.state.status === Status.Failure
      ? loginViewModel.state.error
      : undefined;

  const signUpSubmitError =
    signUpViewModel.state.status === Status.Failure
      ? signUpViewModel.state.error
      : undefined;

  return (
    <LoginScreen
      onSubmit={loginViewModel.submit}
      phoneNumber={loginViewModel.phoneNumber}
      password={loginViewModel.password}
      onPhoneNumberChange={loginViewModel.changePhoneNumber}
      onPasswordChange={loginViewModel.changePassword}
      isPasswordVisible={loginViewModel.isPasswordVisible}
      onTogglePasswordVisibility={loginViewModel.togglePasswordVisibility}
      isSubmitting={loginViewModel.state.status === Status.Loading}
      submitError={loginSubmitError}
      onForgotPasswordPress={onForgotPasswordPress}
      signUpFullName={signUpViewModel.fullName}
      signUpPhoneNumber={signUpViewModel.phoneNumber}
      signUpPassword={signUpViewModel.password}
      onSignUpFullNameChange={signUpViewModel.changeFullName}
      onSignUpPhoneNumberChange={signUpViewModel.changePhoneNumber}
      onSignUpPasswordChange={signUpViewModel.changePassword}
      isSignUpPasswordVisible={signUpViewModel.isPasswordVisible}
      onToggleSignUpPasswordVisibility={signUpViewModel.togglePasswordVisibility}
      isSigningUp={signUpViewModel.state.status === Status.Loading}
      signUpError={signUpSubmitError}
      onSubmitSignUp={signUpViewModel.submit}
    />
  );
}
