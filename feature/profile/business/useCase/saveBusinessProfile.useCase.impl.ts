import {
  BusinessProfileResult,
  BusinessProfileValidationError,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";
import { BusinessProfileRepository } from "../data/repository/businessProfile.repository";
import { SaveBusinessProfileUseCase } from "./saveBusinessProfile.useCase";
import {
  getFirstBusinessProfileFieldErrorMessage,
  validateBusinessProfileFields,
} from "@/feature/profile/business/validation/validateBusinessProfileFields";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const createSaveBusinessProfileUseCase = (
  repository: BusinessProfileRepository,
): SaveBusinessProfileUseCase => ({
  async execute(payload: SaveBusinessProfilePayload): Promise<BusinessProfileResult> {
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
      businessEmail: normalizeRequired(payload.businessEmail).toLowerCase(),
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

    const fieldErrors = validateBusinessProfileFields({
      legalBusinessName: normalizedPayload.legalBusinessName,
      businessType: normalizedPayload.businessType,
      businessPhone: normalizedPayload.businessPhone,
      businessEmail: normalizedPayload.businessEmail,
      registeredAddress: normalizedPayload.registeredAddress,
      currencyCode: normalizedPayload.currencyCode,
      country: normalizedPayload.country,
    });

    const firstErrorMessage =
      getFirstBusinessProfileFieldErrorMessage(fieldErrors);

    if (firstErrorMessage) {
      return {
        success: false,
        error: BusinessProfileValidationError(firstErrorMessage),
      };
    }

    return repository.saveBusinessProfile(normalizedPayload);
  },
});
