import { Control } from "react-hook-form";
import { LoginInput } from "@/feature/auth/login/types/login.types";
import {
  SignUpInput,
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
} from "@/feature/auth/signUp/types/signUp.types";
import {
  SupportedLanguageCode,
  SupportedLanguageOption,
} from "@/shared/i18n/resources";

interface AuthEntryLoginViewModel {
  control: Control<LoginInput>;
  clearSubmitError: () => void;
  isPasswordVisible: boolean;
  togglePasswordVisibility: () => void;
  isSubmitting: boolean;
  submitError?: string;
  submit: () => Promise<void>;
}

interface AuthEntrySignUpViewModel {
  control: Control<SignUpInput>;
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

interface AuthEntryLanguageViewModel {
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
