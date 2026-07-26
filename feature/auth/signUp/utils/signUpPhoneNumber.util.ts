import {
  getAuthPhoneLengthForCountry,
  getInvalidAuthPhoneMessageForCountry,
  isValidAuthPhoneForCountry,
  sanitizeAuthPhoneDigits,
} from "@/shared/utils/auth/authPhoneNumber.util";

export const sanitizeSignUpPhoneDigits = sanitizeAuthPhoneDigits;
export const getSignUpPhoneLengthForCountry = getAuthPhoneLengthForCountry;
export const isValidSignUpPhoneForCountry = isValidAuthPhoneForCountry;
export const getInvalidSignUpPhoneMessageForCountry =
  getInvalidAuthPhoneMessageForCountry;
