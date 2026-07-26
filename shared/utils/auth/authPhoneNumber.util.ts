import { AuthPhoneCountryCode } from "@/shared/constants/authPhone.constants";

type AuthPhoneRule = {
  minLength: number;
  maxLength: number;
  regex: RegExp;
  invalidMessage: string;
};

const AUTH_PHONE_RULES: Record<AuthPhoneCountryCode, AuthPhoneRule> = {
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

export const sanitizeAuthPhoneDigits = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const getAuthPhoneLengthForCountry = (
  countryCode: AuthPhoneCountryCode,
): number => {
  return AUTH_PHONE_RULES[countryCode]?.maxLength ?? 10;
};

export const isValidAuthPhoneForCountry = (
  phoneDigits: string,
  countryCode: AuthPhoneCountryCode,
): boolean => {
  const rule = AUTH_PHONE_RULES[countryCode];

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

export const getInvalidAuthPhoneMessageForCountry = (
  countryCode: AuthPhoneCountryCode,
): string => {
  return (
    AUTH_PHONE_RULES[countryCode]?.invalidMessage ??
    "Enter a valid phone number."
  );
};
