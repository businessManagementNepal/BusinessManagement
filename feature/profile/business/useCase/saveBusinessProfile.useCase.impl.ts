import { BUSINESS_TYPE_VALUES } from "@/shared/constants/businessType.constants";
import {
  BusinessProfileResult,
  BusinessProfileValidationError,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";
import { BusinessProfileRepository } from "../data/repository/businessProfile.repository";
import { SaveBusinessProfileUseCase } from "./saveBusinessProfile.useCase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const isValidPhoneNumber = (value: string): boolean => {
  return PHONE_REGEX.test(value) && /\d/.test(value);
};

export const createSaveBusinessProfileUseCase = (
  repository: BusinessProfileRepository,
): SaveBusinessProfileUseCase => ({
  async execute(payload: SaveBusinessProfilePayload): Promise<BusinessProfileResult> {
    const normalizedBusinessEmail = normalizeRequired(payload.businessEmail).toLowerCase();

    const normalizedPayload: SaveBusinessProfilePayload = {
      ...payload,
      accountRemoteId: normalizeRequired(payload.accountRemoteId),
      ownerUserRemoteId: normalizeRequired(payload.ownerUserRemoteId),
      legalBusinessName: normalizeRequired(payload.legalBusinessName),
      businessType: normalizeRequired(
        payload.businessType,
      ) as SaveBusinessProfilePayload["businessType"],
      businessLogoUrl: normalizeOptional(payload.businessLogoUrl),
      businessPhone: normalizeRequired(payload.businessPhone),
      businessEmail: normalizedBusinessEmail,
      registeredAddress: normalizeRequired(payload.registeredAddress),
      currencyCode: normalizeRequired(payload.currencyCode).toUpperCase(),
      country: normalizeRequired(payload.country),
      city: normalizeRequired(payload.city),
      stateOrDistrict: normalizeRequired(payload.stateOrDistrict),
      taxRegistrationId: normalizeRequired(payload.taxRegistrationId),
    };

    if (!normalizedPayload.accountRemoteId) {
      return {
        success: false,
        error: BusinessProfileValidationError("Account remote id is required."),
      };
    }

    if (!normalizedPayload.ownerUserRemoteId) {
      return {
        success: false,
        error: BusinessProfileValidationError("Owner user remote id is required."),
      };
    }

    if (!normalizedPayload.legalBusinessName) {
      return {
        success: false,
        error: BusinessProfileValidationError("Legal business name is required."),
      };
    }

    if (!BUSINESS_TYPE_VALUES.includes(normalizedPayload.businessType)) {
      return {
        success: false,
        error: BusinessProfileValidationError("Business type is invalid."),
      };
    }

    if (!normalizedPayload.businessPhone) {
      return {
        success: false,
        error: BusinessProfileValidationError("Business phone is required."),
      };
    }

    if (!isValidPhoneNumber(normalizedPayload.businessPhone)) {
      return {
        success: false,
        error: BusinessProfileValidationError("Business phone is invalid."),
      };
    }

    if (
      normalizedPayload.businessEmail.length > 0 &&
      !EMAIL_REGEX.test(normalizedPayload.businessEmail)
    ) {
      return {
        success: false,
        error: BusinessProfileValidationError("Business email is invalid."),
      };
    }

    if (!normalizedPayload.registeredAddress) {
      return {
        success: false,
        error: BusinessProfileValidationError(
          "Registered or operating address is required.",
        ),
      };
    }

    if (normalizedPayload.currencyCode.length !== 3) {
      return {
        success: false,
        error: BusinessProfileValidationError(
          "Currency must be a 3-letter ISO code.",
        ),
      };
    }

    if (!normalizedPayload.country) {
      return {
        success: false,
        error: BusinessProfileValidationError("Country is required."),
      };
    }

    return repository.saveBusinessProfile(normalizedPayload);
  },
});
