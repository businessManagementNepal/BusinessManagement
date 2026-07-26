import { Control } from "react-hook-form";
import {
  LoginFormInput,
  LoginPhoneCountryCode,
  LoginState,
} from "../types/login.types";
import { AuthPhoneCountryOption } from "@/shared/constants/authPhone.constants";

export interface LoginViewModel {
  state: LoginState;
  control: Control<LoginFormInput>;
  selectedPhoneCountryCode: LoginPhoneCountryCode;
  selectedPhoneDialCode: string;
  phoneNumberMaxLength: number;
  phoneCountryOptions: readonly AuthPhoneCountryOption[];
  onChangeSelectedPhoneCountry: (countryCode: LoginPhoneCountryCode) => void;
  isPasswordVisible: boolean;
  clearSubmitError: () => void;
  togglePasswordVisibility: () => void;
  applySignUpRecovery: (params: {
    phoneCountryCode: LoginPhoneCountryCode;
    phoneNumber: string;
    message: string;
  }) => void;
  submit: () => Promise<void>;
}

export type UseLoginViewModelOptions = {
  onSuccess: () => void;
};
