import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/shared/types/status.types";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { LoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase";
import { LoginInput, LoginState } from "../types/login.types";
import { loginFormSchema } from "../validation/login.schema";
import { LoginViewModel, UseLoginViewModelOptions } from "./login.viewModel";

export const useLoginViewModel = (
  useCase: LoginWithEmailUseCase,
  options?: UseLoginViewModelOptions,
): LoginViewModel => {
  const [state, setState] = useState<LoginState>({ status: Status.Idle });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
  } = useForm<LoginInput>({
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
    resolver: zodResolver(loginFormSchema),
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
    async (payload: LoginInput): Promise<void> => {
      if (state.status === Status.Loading) {
        return;
      }

      setState({ status: Status.Loading });

      try {
        const result = await useCase.login(payload);

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

export default useLoginViewModel;
