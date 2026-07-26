import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/shared/types/status.types";
import { composePhoneNumberWithDialCode } from "@/shared/utils/auth/phoneNumber.util";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { LoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase";
import {
  LoginFormInput,
  LoginPhoneCountryCode,
  LOGIN_PHONE_COUNTRY_OPTIONS,
  LoginState,
} from "../types/login.types";
import { loginFormSchema } from "../validation/login.schema";
import { LoginViewModel, UseLoginViewModelOptions } from "./login.viewModel";
import {
  getAuthPhoneLengthForCountry,
  sanitizeAuthPhoneDigits,
} from "@/shared/utils/auth/authPhoneNumber.util";

const DEFAULT_PHONE_COUNTRY_CODE: LoginPhoneCountryCode = "NP";

const getCountryOptionByCode = (countryCode: LoginPhoneCountryCode) => {
  return (
    LOGIN_PHONE_COUNTRY_OPTIONS.find((option) => option.code === countryCode) ??
    LOGIN_PHONE_COUNTRY_OPTIONS[0]
  );
};

export const useLoginViewModel = (
  useCase: LoginWithEmailUseCase,
  options: UseLoginViewModelOptions,
): LoginViewModel => {
  const [state, setState] = useState<LoginState>({ status: Status.Idle });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    getValues,
    setValue,
  } = useForm<LoginFormInput>({
    defaultValues: {
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      phoneNumber: "",
      password: "",
    },
    resolver: zodResolver(loginFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const selectedPhoneCountryCode =
    useWatch({
      control,
      name: "phoneCountryCode",
    }) ?? DEFAULT_PHONE_COUNTRY_CODE;

  const selectedPhoneCountryOption = useMemo(
    () => getCountryOptionByCode(selectedPhoneCountryCode),
    [selectedPhoneCountryCode],
  );

  const phoneNumberMaxLength = useMemo(
    () => getAuthPhoneLengthForCountry(selectedPhoneCountryCode),
    [selectedPhoneCountryCode],
  );

  const clearSubmitError = useCallback(() => {
    if (state.status !== Status.Failure) {
      return;
    }

    setState({ status: Status.Idle });
  }, [state.status]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previousValue) => !previousValue);
  }, []);

  const onChangeSelectedPhoneCountry = useCallback(
    (countryCode: LoginPhoneCountryCode) => {
      const currentPhoneCountryCode = getValues("phoneCountryCode");

      if (currentPhoneCountryCode === countryCode) {
        return;
      }

      const nextPhoneMaxLength = getAuthPhoneLengthForCountry(countryCode);
      const currentPhoneNumber = sanitizeAuthPhoneDigits(getValues("phoneNumber"));

      setValue("phoneNumber", currentPhoneNumber.slice(0, nextPhoneMaxLength), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });

      setValue("phoneCountryCode", countryCode, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });

      clearErrors("phoneNumber");
    },
    [clearErrors, getValues, setValue],
  );

  const applySignUpRecovery = useCallback(
    (params: {
      phoneCountryCode: LoginPhoneCountryCode;
      phoneNumber: string;
      message: string;
    }) => {
      const nextCountryCode = params.phoneCountryCode;
      const nextPhoneLength = getAuthPhoneLengthForCountry(nextCountryCode);
      const normalizedPhoneDigits = sanitizeAuthPhoneDigits(params.phoneNumber);

      setValue("phoneCountryCode", nextCountryCode, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("phoneNumber", normalizedPhoneDigits.slice(0, nextPhoneLength), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("password", "", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      clearErrors("phoneNumber");
      clearErrors("password");
      setState({
        status: Status.Failure,
        error: params.message,
      });
    },
    [clearErrors, setValue],
  );

  const submitWithValidPayload = useCallback(
    async (payload: LoginFormInput): Promise<void> => {
      if (state.status === Status.Loading) {
        return;
      }

      const normalizedPhoneDigits = sanitizeAuthPhoneDigits(payload.phoneNumber);
      const selectedCountryOption = getCountryOptionByCode(payload.phoneCountryCode);
      const normalizedPhoneNumber = composePhoneNumberWithDialCode(
        normalizedPhoneDigits,
        selectedCountryOption.dialCode,
      );

      setState({ status: Status.Loading });

      try {
        const result = await useCase.login({
          phoneNumber: normalizedPhoneNumber,
          password: payload.password,
        });

        if (result.success) {
          setState({ status: Status.Success });
          options.onSuccess();

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
    selectedPhoneCountryCode,
    selectedPhoneDialCode: selectedPhoneCountryOption.dialCode,
    phoneNumberMaxLength,
    phoneCountryOptions: LOGIN_PHONE_COUNTRY_OPTIONS,
    onChangeSelectedPhoneCountry,
    isPasswordVisible,
    clearSubmitError,
    togglePasswordVisibility,
    applySignUpRecovery,
    submit,
  };
};

export default useLoginViewModel;
