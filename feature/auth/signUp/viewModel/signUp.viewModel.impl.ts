import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/shared/types/status.types";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  SIGN_UP_PHONE_COUNTRY_OPTIONS,
  SignUpInput,
  SignUpPhoneCountryCode,
  SignUpState,
} from "../types/signUp.types";
import { signUpFormSchema } from "../validation/signUp.schema";
import { SignUpWithEmailUseCase } from "../useCase/signUpWithEmail.useCase";
import { SignUpViewModel, UseSignUpViewModelOptions } from "./signUp.viewModel";
import {
  getInvalidSignUpPhoneMessageForCountry,
  getSignUpPhoneLengthForCountry,
  isValidSignUpPhoneForCountry,
  sanitizeSignUpPhoneDigits,
} from "../utils/signUpPhoneNumber.util";

const getCountryOptionByCode = (countryCode: SignUpPhoneCountryCode) => {
  return (
    SIGN_UP_PHONE_COUNTRY_OPTIONS.find((option) => option.code === countryCode) ??
    SIGN_UP_PHONE_COUNTRY_OPTIONS[0]
  );
};

export const useSignUpViewModel = (
  useCase: SignUpWithEmailUseCase,
  options?: UseSignUpViewModelOptions,
): SignUpViewModel => {
  const [state, setState] = useState<SignUpState>({ status: Status.Idle });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [selectedPhoneCountryCode, setSelectedPhoneCountryCode] =
    useState<SignUpPhoneCountryCode>("NP");

  const {
    control,
    handleSubmit,
    clearErrors,
    getValues,
    setError,
    setValue,
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

  const selectedPhoneCountryOption = useMemo(
    () => getCountryOptionByCode(selectedPhoneCountryCode),
    [selectedPhoneCountryCode],
  );

  const phoneNumberMaxLength = useMemo(
    () => getSignUpPhoneLengthForCountry(selectedPhoneCountryCode),
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
    (countryCode: SignUpPhoneCountryCode) => {
      if (selectedPhoneCountryCode === countryCode) {
        return;
      }

      const nextPhoneMaxLength = getSignUpPhoneLengthForCountry(countryCode);
      const currentPhoneNumber = sanitizeSignUpPhoneDigits(getValues("phoneNumber"));

      setValue(
        "phoneNumber",
        currentPhoneNumber.slice(0, nextPhoneMaxLength),
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        },
      );

      clearErrors("phoneNumber");
      setSelectedPhoneCountryCode(countryCode);
    },
    [clearErrors, getValues, selectedPhoneCountryCode, setValue],
  );

  const submitWithValidPayload = useCallback(
    async (payload: SignUpInput): Promise<void> => {
      if (state.status === Status.Loading) {
        return;
      }

      const normalizedPhoneDigits = sanitizeSignUpPhoneDigits(payload.phoneNumber);

      if (!normalizedPhoneDigits) {
        setError("phoneNumber", {
          type: "manual",
          message: "Phone number is required.",
        });

        setState((currentState) =>
          currentState.status === Status.Failure
            ? { status: Status.Idle }
            : currentState,
        );
        return;
      }

      if (
        !isValidSignUpPhoneForCountry(
          normalizedPhoneDigits,
          selectedPhoneCountryCode,
        )
      ) {
        setError("phoneNumber", {
          type: "manual",
          message: getInvalidSignUpPhoneMessageForCountry(selectedPhoneCountryCode),
        });

        setState((currentState) =>
          currentState.status === Status.Failure
            ? { status: Status.Idle }
            : currentState,
        );
        return;
      }

      clearErrors("phoneNumber");

      const normalizedPayload: SignUpInput = {
        ...payload,
        phoneNumber: `${selectedPhoneCountryOption.dialCode}${normalizedPhoneDigits}`,
      };

      setState({ status: Status.Loading });

      try {
        const result = await useCase.signUp(normalizedPayload);

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
    [
      clearErrors,
      options,
      selectedPhoneCountryCode,
      selectedPhoneCountryOption.dialCode,
      setError,
      state.status,
      useCase,
    ],
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
    phoneCountryOptions: SIGN_UP_PHONE_COUNTRY_OPTIONS,
    onChangeSelectedPhoneCountry,
    isPasswordVisible,
    clearSubmitError,
    togglePasswordVisibility,
    submit,
  };
};

export default useSignUpViewModel;
