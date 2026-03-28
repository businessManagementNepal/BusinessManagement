import { useMemo } from "react";
import { Status } from "@/shared/types/status.types";
import { SignUpWithEmailUseCase } from "@/feature/auth/signUp/useCase/signUpWithEmail.useCase";
import { useSignUpViewModel } from "@/feature/auth/signUp/viewModel/signUp.viewModel.impl";
import { AuthEntrySignUpViewModel } from "../viewModel/authEntry.viewModel";

type UseAuthEntrySignUpFeatureParams = {
  signUpWithEmailUseCase: SignUpWithEmailUseCase;
  onSuccess?: () => void;
};

export function useAuthEntrySignUpFeature(
  params: UseAuthEntrySignUpFeatureParams,
): AuthEntrySignUpViewModel {
  const { signUpWithEmailUseCase, onSuccess } = params;

  const signUpViewModel = useSignUpViewModel(signUpWithEmailUseCase, {
    onSuccess,
  });

  const isSubmitting = signUpViewModel.state.status === Status.Loading;
  const hasSucceeded = signUpViewModel.state.status === Status.Success;
  const submitError =
    signUpViewModel.state.status === Status.Failure
      ? signUpViewModel.state.error
      : undefined;

  return useMemo<AuthEntrySignUpViewModel>(
    () => ({
      control: signUpViewModel.control,
      selectedPhoneCountryCode: signUpViewModel.selectedPhoneCountryCode,
      selectedPhoneDialCode: signUpViewModel.selectedPhoneDialCode,
      phoneNumberMaxLength: signUpViewModel.phoneNumberMaxLength,
      phoneCountryOptions: signUpViewModel.phoneCountryOptions,
      selectedProfileType: signUpViewModel.selectedProfileType,
      selectedBusinessType: signUpViewModel.selectedBusinessType,
      businessTypeOptions: signUpViewModel.businessTypeOptions,
      businessTypeError: signUpViewModel.businessTypeError,
      onChangeSelectedPhoneCountry: signUpViewModel.onChangeSelectedPhoneCountry,
      onChangeSelectedProfileType: signUpViewModel.onChangeSelectedProfileType,
      onChangeSelectedBusinessType: signUpViewModel.onChangeSelectedBusinessType,
      clearSubmitError: signUpViewModel.clearSubmitError,
      isPasswordVisible: signUpViewModel.isPasswordVisible,
      togglePasswordVisibility: signUpViewModel.togglePasswordVisibility,
      hasSucceeded,
      isSubmitting,
      submitError,
      submit: signUpViewModel.submit,
    }),
    [
      signUpViewModel.control,
      signUpViewModel.selectedPhoneCountryCode,
      signUpViewModel.selectedPhoneDialCode,
      signUpViewModel.phoneNumberMaxLength,
      signUpViewModel.phoneCountryOptions,
      signUpViewModel.selectedProfileType,
      signUpViewModel.selectedBusinessType,
      signUpViewModel.businessTypeOptions,
      signUpViewModel.businessTypeError,
      signUpViewModel.onChangeSelectedPhoneCountry,
      signUpViewModel.onChangeSelectedProfileType,
      signUpViewModel.onChangeSelectedBusinessType,
      signUpViewModel.clearSubmitError,
      signUpViewModel.isPasswordVisible,
      signUpViewModel.togglePasswordVisibility,
      hasSucceeded,
      signUpViewModel.submit,
      isSubmitting,
      submitError,
    ],
  );
}
