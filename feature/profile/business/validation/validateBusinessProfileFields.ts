import { BUSINESS_TYPE_VALUES } from "@/shared/constants/businessType.constants";
import {
  BusinessProfileFieldErrors,
  BusinessProfileFieldName,
} from "@/feature/profile/business/types/businessProfile.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;

export type ValidateBusinessProfileFieldsParams = {
  legalBusinessName: string;
  businessType: string;
  businessPhone: string;
  businessEmail: string;
  registeredAddress: string;
  currencyCode: string;
  country: string;
};

const FIELD_ERROR_ORDER: readonly BusinessProfileFieldName[] = [
  "legalBusinessName",
  "businessType",
  "businessPhone",
  "businessEmail",
  "registeredAddress",
  "currencyCode",
  "country",
];

const isValidPhoneNumber = (value: string): boolean => {
  return PHONE_REGEX.test(value) && /\d/.test(value);
};

export const validateBusinessProfileFields = ({
  legalBusinessName,
  businessType,
  businessPhone,
  businessEmail,
  registeredAddress,
  currencyCode,
  country,
}: ValidateBusinessProfileFieldsParams): BusinessProfileFieldErrors => {
  const nextFieldErrors: BusinessProfileFieldErrors = {};

  const normalizedLegalBusinessName = legalBusinessName.trim();
  const normalizedBusinessType = businessType.trim();
  const normalizedBusinessPhone = businessPhone.trim();
  const normalizedBusinessEmail = businessEmail.trim().toLowerCase();
  const normalizedRegisteredAddress = registeredAddress.trim();
  const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
  const normalizedCountry = country.trim();

  if (!normalizedLegalBusinessName) {
    nextFieldErrors.legalBusinessName = "Legal business name is required.";
  }

  if (
    !BUSINESS_TYPE_VALUES.includes(
      normalizedBusinessType as (typeof BUSINESS_TYPE_VALUES)[number],
    )
  ) {
    nextFieldErrors.businessType = "Business type is invalid.";
  }

  if (!normalizedBusinessPhone) {
    nextFieldErrors.businessPhone = "Business phone is required.";
  } else if (!isValidPhoneNumber(normalizedBusinessPhone)) {
    nextFieldErrors.businessPhone = "Business phone is invalid.";
  }

  if (
    normalizedBusinessEmail.length > 0 &&
    !EMAIL_REGEX.test(normalizedBusinessEmail)
  ) {
    nextFieldErrors.businessEmail = "Business email is invalid.";
  }

  if (!normalizedRegisteredAddress) {
    nextFieldErrors.registeredAddress =
      "Registered or operating address is required.";
  }

  if (!normalizedCurrencyCode) {
    nextFieldErrors.currencyCode = "Currency is required.";
  } else if (normalizedCurrencyCode.length !== 3) {
    nextFieldErrors.currencyCode = "Currency must be a 3-letter ISO code.";
  }

  if (!normalizedCountry) {
    nextFieldErrors.country = "Country is required.";
  }

  return nextFieldErrors;
};

export const getFirstBusinessProfileFieldErrorMessage = (
  fieldErrors: BusinessProfileFieldErrors,
): string | null => {
  for (const fieldName of FIELD_ERROR_ORDER) {
    const fieldError = fieldErrors[fieldName];
    if (fieldError) {
      return fieldError;
    }
  }

  return null;
};
