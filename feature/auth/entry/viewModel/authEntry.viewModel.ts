import { Control } from "react-hook-form";
import { LoginInput } from "@/feature/auth/login/types/login.types";
import {
  SignUpFormInput,
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
} from "@/feature/auth/signUp/types/signUp.types";
import {
  SupportedLanguageCode,
  SupportedLanguageOption,
} from "@/shared/i18n/resources";

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

export interface AuthEntryLanguageViewModel {
  selectedLanguageCode: SupportedLanguageCode;
  options: readonly SupportedLanguageOption[];
  onChangeSelectedLanguage: (languageCode: SupportedLanguageCode) => void;
}

export interface AuthEntryViewModel {
  language: AuthEntryLanguageViewModel;
  login: AuthEntryLoginViewModel;
  signUp: AuthEntrySignUpViewModel;
  onForgotPasswordPress?: () => void;
}
