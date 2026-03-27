import { Status } from "@/shared/types/status.types";
import { useCallback, useState } from "react";
import { LoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase";
import { LoginState } from "../types/login.types";
import { LoginViewModel, UseLoginViewModelOptions } from "./login.viewModel";

export const useLoginViewModel = (
  useCase: LoginWithEmailUseCase,
  options?: UseLoginViewModelOptions,
): LoginViewModel => {
  const [state, setState] = useState<LoginState>({ status: Status.Idle });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const resetError = useCallback(() => {
    setState((previousState) =>
      previousState.status === Status.Failure
        ? { status: Status.Idle }
        : previousState,
    );
  }, []);

  const changePhoneNumber = useCallback(
    (value: string) => {
      if (state.status === Status.Loading) {
        return;
      }

      setPhoneNumber(value);
      resetError();
    },
    [resetError, state.status],
  );

  const changePassword = useCallback(
    (value: string) => {
      if (state.status === Status.Loading) {
        return;
      }

      setPassword(value);
      resetError();
    },
    [resetError, state.status],
  );

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previousValue) => !previousValue);
  }, []);

  const submit = useCallback(async () => {
    if (state.status === Status.Loading) {
      return;
    }

    setState({ status: Status.Loading });

    try {
      const result = await useCase.login({
        phoneNumber,
        password,
      });

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
  }, [options, password, phoneNumber, state.status, useCase]);

  return {
    state,
    phoneNumber,
    password,
    isPasswordVisible,
    changePhoneNumber,
    changePassword,
    togglePasswordVisibility,
    submit,
  };
};

export default useLoginViewModel;
