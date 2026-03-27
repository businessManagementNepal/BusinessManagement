import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/shared/types/status.types";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { SignUpInput, SignUpState } from "../types/signUp.types";
import { signUpFormSchema } from "../validation/signUp.schema";
import { SignUpWithEmailUseCase } from "../useCase/signUpWithEmail.useCase";
import { SignUpViewModel, UseSignUpViewModelOptions } from "./signUp.viewModel";

export const useSignUpViewModel = (
  useCase: SignUpWithEmailUseCase,
  options?: UseSignUpViewModelOptions,
): SignUpViewModel => {
  const [state, setState] = useState<SignUpState>({ status: Status.Idle });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
  } = useForm<SignUpInput>({
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      password: "",
    },
    resolver: zodResolver(signUpFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const clearSubmitError = useCallback(() => {
    if (state.status !== Status.Failure) {
      return;
    }

    setState({ status: Status.Idle });
  }, [state.status]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previousValue) => !previousValue);
  }, []);

  const submitWithValidPayload = useCallback(
    async (payload: SignUpInput): Promise<void> => {
      if (state.status === Status.Loading) {
        return;
      }

      setState({ status: Status.Loading });

      try {
        const result = await useCase.signUp(payload);

        if (result.success) {
          setState({ status: Status.Success });

          if (options?.onSuccess) {
            options.onSuccess();
          }

          return;
        }

        setState({
          status: Status.Failure,
          error: result.error.message,
        });
      } catch (error) {
        setState({
          status: Status.Failure,
          error: error instanceof Error ? error.message : "Unexpected error",
        });
      }
    },
    [options, state.status, useCase],
  );

  const submit = useCallback(async () => {
    if (state.status === Status.Loading) {
      return;
    }

    await handleSubmit(submitWithValidPayload)();
  }, [handleSubmit, state.status, submitWithValidPayload]);

  return {
    state,
    control,
    isPasswordVisible,
    clearSubmitError,
    togglePasswordVisibility,
    submit,
  };
};

export default useSignUpViewModel;
