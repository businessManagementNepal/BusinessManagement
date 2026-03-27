import { VerifiedLocalCredential } from "@/feature/session/types/authSession.types";
import { Result } from "@/shared/types/result.types";
import { Status } from "@/shared/types/status.types";

export const SignUpErrorType = {
  ValidationError: "VALIDATION_ERROR",
  PhoneNumberAlreadyInUse: "PHONE_NUMBER_ALREADY_IN_USE",
  DatabaseError: "DATABASE_ERROR",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type SignUpError = {
  type: (typeof SignUpErrorType)[keyof typeof SignUpErrorType];
  message: string;
};

export const ValidationError = (message: string): SignUpError => ({
  type: SignUpErrorType.ValidationError,
  message,
});

export const PhoneNumberAlreadyInUseError: SignUpError = {
  type: SignUpErrorType.PhoneNumberAlreadyInUse,
  message: "An account with this phone number already exists.",
};

export const DatabaseError: SignUpError = {
  type: SignUpErrorType.DatabaseError,
  message: "Unable to process your request right now. Please try again.",
};

export const UnknownError: SignUpError = {
  type: SignUpErrorType.UnknownError,
  message: "An unexpected error occurred.",
};

export type SignUpInput = {
  fullName: string;
  phoneNumber: string;
  password: string;
};

export type SignUpPhoneCountryCode = "NP" | "IN";

export type SignUpPhoneCountryOption = {
  code: SignUpPhoneCountryCode;
  dialCode: string;
  label: string;
  flag: string;
};

export const SIGN_UP_PHONE_COUNTRY_OPTIONS: readonly SignUpPhoneCountryOption[] = [
  {
    code: "NP",
    dialCode: "+977",
    label: "Nepal (+977)",
    flag: "🇳🇵",
  },
  {
    code: "IN",
    dialCode: "+91",
    label: "India (+91)",
    flag: "🇮🇳",
  },
];

export type SignUpResult = Result<VerifiedLocalCredential, SignUpError>;

export type SignUpState =
  | { status: typeof Status.Idle }
  | { status: typeof Status.Loading }
  | { status: typeof Status.Success }
  | { status: typeof Status.Failure; error: string };
