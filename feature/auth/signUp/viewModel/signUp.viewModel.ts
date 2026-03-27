import { Control } from "react-hook-form";
import {
  SignUpInput,
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
  SignUpState,
} from "../types/signUp.types";

export interface SignUpViewModel {
  state: SignUpState;
  control: Control<SignUpInput>;
  selectedPhoneCountryCode: SignUpPhoneCountryCode;
  selectedPhoneDialCode: string;
  phoneNumberMaxLength: number;
  phoneCountryOptions: readonly SignUpPhoneCountryOption[];
  onChangeSelectedPhoneCountry: (
    countryCode: SignUpPhoneCountryCode,
  ) => void;
  isPasswordVisible: boolean;
  clearSubmitError: () => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
}

export type UseSignUpViewModelOptions = {
  onSuccess?: () => void;
};
