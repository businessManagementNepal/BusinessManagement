import { Control } from "react-hook-form";
import {
  SignUpProfileTypeValue,
  SignUpFormInput,
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
} from "@/feature/auth/signUp/types/signUp.types";
import {
  BusinessTypeOption,
  BusinessTypeValue,
} from "@/shared/constants/businessType.constants";

export interface AuthEntrySignUpViewModel {
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
  clearSubmitError: () => void;
  isPasswordVisible: boolean;
  togglePasswordVisibility: () => void;
  hasSucceeded: boolean;
  isSubmitting: boolean;
  submitError?: string;
  submit: () => Promise<void>;
}
