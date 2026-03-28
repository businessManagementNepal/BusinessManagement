import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/shared/types/status.types";
import { useCallback, useMemo, useState } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import {
  SIGN_UP_BUSINESS_TYPE_OPTIONS,
  SIGN_UP_PHONE_COUNTRY_OPTIONS,
  SignUpFormInput,
  SignUpInput,
  SignUpPhoneCountryCode,
  SignUpProfileType,
  SignUpProfileTypeValue,
  SignUpState,
} from "../types/signUp.types";
import { signUpFormSchema } from "../validation/signUp.schema";
import { SignUpWithEmailUseCase } from "../useCase/signUpWithEmail.useCase";
import { SignUpViewModel, UseSignUpViewModelOptions } from "./signUp.viewModel";
import {
  getSignUpPhoneLengthForCountry,
  sanitizeSignUpPhoneDigits,
} from "../utils/signUpPhoneNumber.util";

const DEFAULT_PHONE_COUNTRY_CODE: SignUpPhoneCountryCode = "NP";

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

  const {
    control,
    handleSubmit,
    clearErrors,
    getValues,
    setValue,
  } = useForm<SignUpFormInput>({
    defaultValues: {
      fullName: "",
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      profileType: SignUpProfileType.Personal,
      businessType: "",
      phoneNumber: "",
      password: "",
    },
    resolver: zodResolver(signUpFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const selectedPhoneCountryCode =
    useWatch({
      control,
      name: "phoneCountryCode",
    }) ?? DEFAULT_PHONE_COUNTRY_CODE;
  const selectedProfileType =
    useWatch({
      control,
      name: "profileType",
    }) ?? SignUpProfileType.Personal;
  const selectedBusinessType =
    useWatch({
      control,
      name: "businessType",
    }) ?? "";

  const selectedPhoneCountryOption = useMemo(
    () => getCountryOptionByCode(selectedPhoneCountryCode),
    [selectedPhoneCountryCode],
  );
  const { errors } = useFormState({ control });

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
      const currentPhoneCountryCode = getValues("phoneCountryCode");

      if (currentPhoneCountryCode === countryCode) {
        return;
      }

      const nextPhoneMaxLength = getSignUpPhoneLengthForCountry(countryCode);
      const currentPhoneNumber = sanitizeSignUpPhoneDigits(getValues("phoneNumber"));

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

  const onChangeSelectedProfileType = useCallback(
    (profileType: SignUpProfileTypeValue): void => {
      if (getValues("profileType") === profileType) {
        return;
      }

      setValue("profileType", profileType, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });

      if (profileType === SignUpProfileType.Personal) {
        setValue("businessType", "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        });
      }

      clearErrors("businessType");
    },
    [clearErrors, getValues, setValue],
  );

  const onChangeSelectedBusinessType = useCallback(
    (businessType: SignUpFormInput["businessType"]): void => {
      setValue("businessType", businessType, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });

      clearErrors("businessType");
    },
    [clearErrors, setValue],
  );

  const submitWithValidPayload = useCallback(
    async (payload: SignUpFormInput): Promise<void> => {
      if (state.status === Status.Loading) {
        return;
      }

      const selectedCountryOption = getCountryOptionByCode(payload.phoneCountryCode);
      const normalizedPhoneDigits = sanitizeSignUpPhoneDigits(payload.phoneNumber);
      const selectedBusinessTypeOption = SIGN_UP_BUSINESS_TYPE_OPTIONS.find(
        (option) => option.value === payload.businessType,
      );

      const normalizedPayload: SignUpInput = {
        fullName: payload.fullName,
        phoneNumber: `${selectedCountryOption.dialCode}${normalizedPhoneDigits}`,
        password: payload.password,
        profileType: payload.profileType,
        businessType:
          payload.profileType === SignUpProfileType.Business
            ? selectedBusinessTypeOption?.value ?? null
            : null,
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
    phoneCountryOptions: SIGN_UP_PHONE_COUNTRY_OPTIONS,
    selectedProfileType,
    selectedBusinessType,
    businessTypeOptions: SIGN_UP_BUSINESS_TYPE_OPTIONS,
    businessTypeError:
      typeof errors.businessType?.message === "string"
        ? errors.businessType.message
        : undefined,
    onChangeSelectedPhoneCountry,
    onChangeSelectedProfileType,
    onChangeSelectedBusinessType,
    isPasswordVisible,
    clearSubmitError,
    togglePasswordVisibility,
    submit,
  };
};

export default useSignUpViewModel;
