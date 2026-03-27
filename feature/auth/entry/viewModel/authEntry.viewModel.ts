import { Control } from "react-hook-form";
import { LoginInput } from "@/feature/auth/login/types/login.types";
import {
  SignUpFormInput,
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
} from "@/feature/auth/signUp/types/signUp.types";
import { LanguageSelectionViewModel } from "@/feature/appSettings/types/languageSelection.types";

export interface AuthEntryLoginViewModel {
  control: Control<LoginInput>;
  clearSubmitError: () => void;
  isPasswordVisible: boolean;
  togglePasswordVisibility: () => void;
  isSubmitting: boolean;
  submitError?: string;
  submit: () => Promise<void>;
}

export interface AuthEntrySignUpViewModel {
  control: Control<SignUpFormInput>;
  selectedPhoneCountryCode: SignUpPhoneCountryCode;
  selectedPhoneDialCode: string;
  phoneNumberMaxLength: number;
  phoneCountryOptions: readonly SignUpPhoneCountryOption[];
  onChangeSelectedPhoneCountry: (
    countryCode: SignUpPhoneCountryCode,
  ) => void;
  clearSubmitError: () => void;
  isPasswordVisible: boolean;
  togglePasswordVisibility: () => void;
  isSubmitting: boolean;
  submitError?: string;
  submit: () => Promise<void>;
}

export interface AuthEntryViewModel {
  language: LanguageSelectionViewModel;
  login: AuthEntryLoginViewModel;
  signUp: AuthEntrySignUpViewModel;
  onForgotPasswordPress?: () => void;
}

