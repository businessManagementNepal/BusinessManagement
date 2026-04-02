import { SignUpPhoneCountryCode } from "../types/signUp.types";

type SignUpPhoneRule = {
  minLength: number;
  maxLength: number;
  regex: RegExp;
  invalidMessage: string;
};

const SIGN_UP_PHONE_RULES: Record<SignUpPhoneCountryCode, SignUpPhoneRule> = {
  NP: {
    minLength: 10,
    maxLength: 10,
    regex: /^9\d{9}$/,
    invalidMessage: "Enter a valid Nepal phone number.",
  },
  IN: {
    minLength: 10,
    maxLength: 10,
    regex: /^[6-9]\d{9}$/,
    invalidMessage: "Enter a valid India phone number.",
  },
};

export const sanitizeSignUpPhoneDigits = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const getSignUpPhoneLengthForCountry = (
  countryCode: SignUpPhoneCountryCode,
): number => {
  return SIGN_UP_PHONE_RULES[countryCode]?.maxLength ?? 10;
};

export const isValidSignUpPhoneForCountry = (
  phoneDigits: string,
  countryCode: SignUpPhoneCountryCode,
): boolean => {
  const rule = SIGN_UP_PHONE_RULES[countryCode];

  if (!rule) {
    return false;
  }

  if (
    phoneDigits.length < rule.minLength ||
    phoneDigits.length > rule.maxLength
  ) {
    return false;
  }

  return rule.regex.test(phoneDigits);
};

export const getInvalidSignUpPhoneMessageForCountry = (
  countryCode: SignUpPhoneCountryCode,
): string => {
  return (
    SIGN_UP_PHONE_RULES[countryCode]?.invalidMessage ?? "Enter a valid phone number."
  );
};
