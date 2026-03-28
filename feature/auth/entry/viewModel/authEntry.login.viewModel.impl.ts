import { useMemo } from "react";
import { Status } from "@/shared/types/status.types";
import { LoginWithEmailUseCase } from "@/feature/auth/login/useCase/loginWithEmail.useCase";
import { useLoginViewModel } from "@/feature/auth/login/viewModel/login.viewModel.impl";
import { AuthEntryLoginViewModel } from "./authEntry.login.viewModel";

type UseAuthEntryLoginViewModelParams = {
  loginWithEmailUseCase: LoginWithEmailUseCase;
  onSuccess?: () => void;
};

export const useAuthEntryLoginViewModel = (
  params: UseAuthEntryLoginViewModelParams,
): AuthEntryLoginViewModel => {
  const { loginWithEmailUseCase, onSuccess } = params;

  const loginViewModel = useLoginViewModel(loginWithEmailUseCase, {
    onSuccess,
  });

  const isSubmitting = loginViewModel.state.status === Status.Loading;
  const submitError =
    loginViewModel.state.status === Status.Failure
      ? loginViewModel.state.error
      : undefined;

  return useMemo<AuthEntryLoginViewModel>(
    () => ({
      control: loginViewModel.control,
      clearSubmitError: loginViewModel.clearSubmitError,
      isPasswordVisible: loginViewModel.isPasswordVisible,
      togglePasswordVisibility: loginViewModel.togglePasswordVisibility,
      isSubmitting,
      submitError,
      submit: loginViewModel.submit,
    }),
    [
      loginViewModel.control,
      loginViewModel.clearSubmitError,
      loginViewModel.isPasswordVisible,
      loginViewModel.togglePasswordVisibility,
      loginViewModel.submit,
      isSubmitting,
      submitError,
    ],
  );
};
