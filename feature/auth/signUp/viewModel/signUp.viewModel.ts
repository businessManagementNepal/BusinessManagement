import { Control } from "react-hook-form";
import {
  SignUpFormInput,
  SignUpProfileTypeValue,
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
  SignUpState,
} from "../types/signUp.types";
import {
  BusinessTypeOption,
  BusinessTypeValue,
} from "@/shared/constants/businessType.constants";

export interface SignUpViewModel {
  state: SignUpState;
  control: Control<SignUpFormInput>;
  selectedPhoneCountryCode: SignUpPhoneCountryCode;
  selectedPhoneDialCode: string;
  phoneNumberMaxLength: number;
  phoneCountryOptions: readonly SignUpPhoneCountryOption[];
  selectedProfileType: SignUpProfileTypeValue;
  selectedBusinessType: string;
  businessTypeOptions: readonly BusinessTypeOption[];
  businessTypeError?: string;
  onChangeSelectedPhoneCountry: (
    countryCode: SignUpPhoneCountryCode,
  ) => void;
  onChangeSelectedProfileType: (profileType: SignUpProfileTypeValue) => void;
  onChangeSelectedBusinessType: (businessType: BusinessTypeValue) => void;
  isPasswordVisible: boolean;
  clearSubmitError: () => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseSignUpViewModelOptions = {
  onSuccess?: () => void;
};
